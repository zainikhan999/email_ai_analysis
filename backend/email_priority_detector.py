# email_priority_detector.py
import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Load .env
load_dotenv()

# Initialize LLM for priority detection
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,  # Consistency critical for priority classification
    api_key=GROQ_API_KEY
)

# Pydantic models
class PriorityAnalysis(BaseModel):
    """Represents priority analysis for an email"""
    priority_level: str  # high, medium, low
    confidence: float  # 0-1
    urgency_score: int  # 1-10
    reasoning: str
    detected_signals: List[str]
    suggested_action: str

class PriorityDetectionRequest(BaseModel):
    """Request to detect email priority"""
    subject: str
    sender: str
    content: str
    sender_history: Optional[str] = None  # e.g., "VIP customer", "Internal team lead"

class PriorityStats(BaseModel):
    """Statistics about email priorities"""
    total_emails: int
    high_count: int
    medium_count: int
    low_count: int
    high_percentage: float
    avg_urgency_score: float

# Key phrases for priority detection
URGENT_KEYWORDS = [
    "urgent", "asap", "immediately", "critical", "emergency", "alert",
    "severe", "crisis", "down", "outage", "failure", "broken", "issue",
    "must", "cannot wait", "right now", "today", "this hour", "deadline",
    "overdue", "late", "delayed", "stuck", "blocked", "unblocked needed"
]

DELAY_KEYWORDS = [
    "delay", "postpone", "push back", "reschedule", "extend", "defer",
    "later", "next week", "soon", "eventually", "when possible"
]

MEDIUM_KEYWORDS = [
    "should", "need to", "would like", "please review", "feedback",
    "progress", "update", "check", "follow up", "reminder", "fyi"
]

LOW_KEYWORDS = [
    "fyi", "for your information", "heads up", "note", "just so you know",
    "btw", "by the way", "optional", "whenever", "no rush", "low priority"
]

def detect_email_priority(
    subject: str,
    sender: str,
    content: str,
    sender_history: Optional[str] = None
) -> PriorityAnalysis:
    """
    Detect email priority level using AI analysis.
    
    Args:
        subject: Email subject line
        sender: Sender email/name
        content: Email body content
        sender_history: Context about sender (e.g., "VIP customer", "CEO")
    
    Returns:
        PriorityAnalysis with priority level and reasoning
    """
    
    # Combine email content for analysis
    full_content = f"Subject: {subject}\nFrom: {sender}\n\nContent:\n{content}"
    
    sender_context = f"\nSender Context: {sender_history}" if sender_history else ""
    
    priority_prompt = f"""You are an email priority detection AI. Analyze the following email and determine its priority level.

Email:
{full_content}
{sender_context}

Priority Detection Criteria:
HIGH URGENCY (1-2 hours): 
- Keywords: URGENT, ASAP, IMMEDIATELY, CRITICAL, EMERGENCY, OUTAGE, DOWN, ALERT
- Multiple urgent signals
- Directly affects business continuity
- Time-sensitive decisions needed
- Escalated from important stakeholders

MEDIUM PRIORITY (Same day - 24 hours):
- Keywords: Should, Need to, Please review, Feedback, Update, Follow up
- Moderate impact on operations
- Standard business tasks
- Can wait a few hours

LOW PRIORITY (This week):
- Keywords: FYI, Optional, Whenever, No rush, Heads up
- Informational content
- Can be deferred
- No immediate action needed

Analyze the email and return ONLY valid JSON (no other text):
{{
  "priority_level": "high|medium|low",
  "urgency_score": 1-10,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of priority assignment",
  "detected_signals": ["signal1", "signal2", "signal3"],
  "suggested_action": "Recommended immediate action or 'Schedule for later' or 'Archive after review'"
}}

Detect priority now:"""
    
    try:
        response = llm.invoke([HumanMessage(content=priority_prompt)])
        response_text = response.content.strip()
        
        # Extract JSON from response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            return PriorityAnalysis(
                priority_level="medium",
                confidence=0.5,
                urgency_score=5,
                reasoning="Default priority - could not parse AI response",
                detected_signals=["parsing_error"],
                suggested_action="Review manually"
            )
        
        json_str = response_text[start_idx:end_idx]
        priority_data = json.loads(json_str)
        
        return PriorityAnalysis(
            priority_level=priority_data.get('priority_level', 'medium').lower(),
            urgency_score=int(priority_data.get('urgency_score', 5)),
            confidence=float(priority_data.get('confidence', 0.5)),
            reasoning=priority_data.get('reasoning', ''),
            detected_signals=priority_data.get('detected_signals', []),
            suggested_action=priority_data.get('suggested_action', 'Review')
        )
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error in priority detection: {str(e)}")
        return PriorityAnalysis(
            priority_level="medium",
            confidence=0.3,
            urgency_score=5,
            reasoning=f"JSON parsing error: {str(e)}",
            detected_signals=["parsing_error"],
            suggested_action="Review manually"
        )
    except Exception as e:
        print(f"Error detecting priority: {str(e)}")
        return PriorityAnalysis(
            priority_level="medium",
            confidence=0.2,
            urgency_score=5,
            reasoning=f"Error: {str(e)}",
            detected_signals=["error"],
            suggested_action="Review manually"
        )

def batch_detect_priorities(emails: List[dict]) -> dict:
    """
    Detect priorities for multiple emails.
    
    Returns:
        {
            "results": [PriorityAnalysis],
            "total_emails": int,
            "high_count": int,
            "medium_count": int,
            "low_count": int,
            "stats": PriorityStats
        }
    """
    results = []
    high_count = 0
    medium_count = 0
    low_count = 0
    total_urgency = 0
    
    for email in emails:
        analysis = detect_email_priority(
            email.get('subject', ''),
            email.get('sender', ''),
            email.get('content', ''),
            email.get('sender_history')
        )
        
        results.append(analysis)
        total_urgency += analysis.urgency_score
        
        if analysis.priority_level == 'high':
            high_count += 1
        elif analysis.priority_level == 'medium':
            medium_count += 1
        else:
            low_count += 1
    
    total_emails = len(emails)
    avg_urgency = total_urgency / total_emails if total_emails > 0 else 0
    
    return {
        "results": results,
        "total_emails": total_emails,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "high_percentage": (high_count / total_emails * 100) if total_emails > 0 else 0,
        "avg_urgency_score": avg_urgency,
        "stats": {
            "total_emails": total_emails,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "high_percentage": (high_count / total_emails * 100) if total_emails > 0 else 0,
            "avg_urgency_score": avg_urgency
        }
    }

def filter_by_priority(emails: List[dict], priority_level: str) -> List[PriorityAnalysis]:
    """Get all emails of a specific priority level."""
    results = batch_detect_priorities(emails)
    return [
        result for result in results['results']
        if result.priority_level == priority_level.lower()
    ]

def get_priority_recommendations(emails: List[dict]) -> dict:
    """
    Get recommendations on which emails need immediate attention.
    
    Returns high-priority emails sorted by urgency score.
    """
    results = batch_detect_priorities(emails)
    
    high_priority = [
        r for r in results['results']
        if r.priority_level == 'high'
    ]
    
    # Sort by urgency score descending
    high_priority.sort(key=lambda x: x.urgency_score, reverse=True)
    
    return {
        "high_priority_emails": high_priority,
        "count": len(high_priority),
        "recommendations": [
            f"Address top {min(3, len(high_priority))} urgent emails first"
            if len(high_priority) > 0
            else "No high-priority emails detected"
        ]
    }
