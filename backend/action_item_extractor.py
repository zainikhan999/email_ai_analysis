# action_item_extractor.py
import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

# Load .env
load_dotenv()

# Initialize LLM for action item extraction
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.3,  # Slightly higher for more creative suggestions
    api_key=GROQ_API_KEY
)

# Pydantic models
class ActionItem(BaseModel):
    """Represents an extracted action item"""
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str  # high, medium, low
    suggested_assignee: Optional[str] = None
    status: str = "pending"  # pending, confirmed, rejected
    confidence: float  # 0-1
    reasoning: str

class ActionItemExtractionRequest(BaseModel):
    """Request to extract action items from email"""
    email_id: int
    subject: str
    sender: str
    content: str

class ActionItemExtractionResponse(BaseModel):
    """Response with extracted action items"""
    email_id: int
    subject: str
    action_items: List[ActionItem]
    total_items: int

def extract_action_items(subject: str, sender: str, content: str) -> List[ActionItem]:
    """
    Extract action items from email using AI.
    
    Looks for:
    - Tasks (requests to do something)
    - Deadlines (dates, time references)
    - Requests (questions, asks)
    - Ownership clues (who should do it)
    """
    
    extraction_prompt = f"""You are an action item extraction AI. Analyze the following email and extract ALL action items.

Email Subject: {subject}
From: {sender}
Content:
{content}

For each action item found, extract:
1. Task title (short, actionable)
2. Description (more details if any)
3. Due date (if mentioned - use format YYYY-MM-DD, or null)
4. Priority (high/medium/low based on urgency keywords like ASAP, urgent, critical, IMPORTANT)
5. Suggested assignee (based on context clues like "Can you...", "John should...", or null)
6. Confidence (0.0-1.0, how certain you are this is an action item)
7. Reasoning (explain why you think this is an action item)

Look for:
- Explicit requests: "Can you...", "Please...", "Need you to..."
- Questions requiring action: "Can we...?", "Do we have...?"
- Implicit tasks: "We should...", "Need to...", "Important to..."
- Deadline clues: "by Friday", "by end of month", "ASAP", "urgent", dates mentioned
- Ownership clues: Names mentioned, departments, pronouns (you, I, we)
- Verb indicators: send, complete, review, approve, prepare, schedule, fix, resolve, investigate

Return ONLY valid JSON array (no other text). If no action items, return empty array [].

Example output:
[
  {{
    "title": "Send Q1 report",
    "description": "Prepare and send the Q1 financial report",
    "due_date": "2026-01-17",
    "priority": "high",
    "suggested_assignee": "Mike",
    "confidence": 0.95,
    "reasoning": "Email explicitly says 'Can you send the report by Friday' with sender asking directly"
  }}
]

Analyze the email now:"""
    
    try:
        response = llm.invoke([HumanMessage(content=extraction_prompt)])
        response_text = response.content.strip()
        
        # Extract JSON from response
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']') + 1
        
        if start_idx == -1 or end_idx == 0:
            return []
        
        json_str = response_text[start_idx:end_idx]
        items_data = json.loads(json_str)
        
        # Convert to ActionItem objects
        action_items = []
        for idx, item in enumerate(items_data):
            action_item = ActionItem(
                id=idx + 1,
                title=item.get('title', 'Untitled'),
                description=item.get('description'),
                due_date=item.get('due_date'),
                priority=item.get('priority', 'medium').lower(),
                suggested_assignee=item.get('suggested_assignee'),
                confidence=float(item.get('confidence', 0.5)),
                reasoning=item.get('reasoning', '')
            )
            action_items.append(action_item)
        
        return action_items
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
        return []
    except Exception as e:
        print(f"Error extracting action items: {str(e)}")
        return []

def batch_extract_action_items(emails: List[dict]) -> dict:
    """
    Extract action items from multiple emails.
    
    Returns:
    {
        "results": [ActionItemExtractionResponse],
        "total_items": int,
        "high_priority_count": int
    }
    """
    results = []
    total_items = 0
    high_priority_count = 0
    
    for email in emails:
        action_items = extract_action_items(
            email.get('subject', ''),
            email.get('sender', ''),
            email.get('content', '')
        )
        
        response = ActionItemExtractionResponse(
            email_id=email.get('id', 0),
            subject=email.get('subject', ''),
            action_items=action_items,
            total_items=len(action_items)
        )
        
        results.append(response)
        total_items += len(action_items)
        high_priority_count += sum(1 for item in action_items if item.priority == 'high')
    
    return {
        "results": results,
        "total_items": total_items,
        "high_priority_count": high_priority_count
    }

def suggest_due_date(text: str) -> Optional[str]:
    """
    Parse due date from text using simple heuristics.
    
    Examples:
    - "by Friday" -> next Friday
    - "by end of month" -> last day of current month
    - "2026-01-20" -> 2026-01-20
    - "ASAP" -> tomorrow
    """
    text_lower = text.lower()
    today = datetime.now()
    
    # Specific date patterns
    if 'asap' in text_lower or 'urgent' in text_lower:
        return (today + timedelta(days=1)).strftime('%Y-%m-%d')
    
    if 'today' in text_lower:
        return today.strftime('%Y-%m-%d')
    
    if 'tomorrow' in text_lower:
        return (today + timedelta(days=1)).strftime('%Y-%m-%d')
    
    if 'end of week' in text_lower or 'this friday' in text_lower:
        days_ahead = 4 - today.weekday()  # Friday is 4
        if days_ahead <= 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    
    if 'end of month' in text_lower:
        if today.month == 12:
            next_month = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month = today.replace(month=today.month + 1, day=1)
        last_day = next_month - timedelta(days=1)
        return last_day.strftime('%Y-%m-%d')
    
    return None

def calculate_priority(text: str, due_date: Optional[str] = None) -> str:
    """
    Calculate priority based on keywords and urgency.
    """
    text_lower = text.lower()
    
    # High priority indicators
    high_priority_keywords = [
        'urgent', 'asap', 'critical', 'emergency', 'immediately',
        'important!!', 'crucial', 'blocking', 'stopped', 'down'
    ]
    
    if any(keyword in text_lower for keyword in high_priority_keywords):
        return 'high'
    
    # Check if due date is soon
    if due_date:
        try:
            due = datetime.strptime(due_date, '%Y-%m-%d')
            days_until = (due - datetime.now()).days
            if days_until <= 1:
                return 'high'
            elif days_until <= 3:
                return 'medium'
        except:
            pass
    
    # Medium priority indicators
    medium_keywords = ['important', 'needed', 'required', 'please', 'soon']
    if any(keyword in text_lower for keyword in medium_keywords):
        return 'medium'
    
    return 'low'
