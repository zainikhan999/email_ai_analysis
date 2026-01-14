# draft_reply_generator.py
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

# Initialize LLM for draft reply generation
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.7,  # Creative but coherent drafts
    api_key=GROQ_API_KEY
)

# Pydantic models
class DraftReply(BaseModel):
    """Represents a draft reply suggestion"""
    tone: str  # professional, friendly, short, apologetic
    subject: str
    body: str
    preview: str  # First 100 chars
    timestamp: str

class DraftReplyRequest(BaseModel):
    """Request to generate a draft reply"""
    original_subject: str
    original_sender: str
    thread_content: str  # Full email thread
    tone: str  # professional, friendly, short, apologetic
    context: Optional[str] = None  # Additional context about organization

def generate_draft_reply(
    original_subject: str,
    original_sender: str,
    thread_content: str,
    tone: str = "professional",
    context: Optional[str] = None
) -> DraftReply:
    """
    Generate a draft reply email with specified tone.
    
    Args:
        original_subject: Subject of the original email
        original_sender: Who sent the original email
        thread_content: Full email thread content
        tone: One of: professional, friendly, short, apologetic
        context: Optional context about the organization
    
    Returns:
        DraftReply with suggested subject and body
    """
    
    # Tone instructions
    tone_instructions = {
        "professional": """Generate a professional, business-appropriate reply. 
        Be formal, concise, and action-oriented. Use proper grammar and avoid slang. 
        Include relevant context and clear next steps.""",
        
        "friendly": """Generate a warm, personable reply while maintaining professionalism. 
        Be conversational, approachable, and encouraging. Use friendly language but stay professional. 
        Acknowledge the sender's tone and build rapport.""",
        
        "short": """Generate a brief, concise reply. 
        Keep it to 2-3 sentences maximum. Get straight to the point. 
        No unnecessary pleasantries, just essential information.""",
        
        "apologetic": """Generate an apologetic, empathetic reply acknowledging the issue. 
        Express genuine concern, take responsibility where appropriate, 
        and provide clear resolution steps. Show customer care and commitment to resolution."""
    }
    
    tone_instruction = tone_instructions.get(tone, tone_instructions["professional"])
    
    context_text = f"\nOrganization Context: {context}" if context else ""
    
    draft_prompt = f"""You are an email assistant. Generate a draft reply email based on the following thread.

Original Email Subject: {original_subject}
From: {original_sender}

Email Thread:
{thread_content}
{context_text}

Tone Requirements:
{tone_instruction}

Generate a professional reply email with:
1. Subject line (starting with "Re: ")
2. Appropriate greeting
3. Well-structured body (2-4 paragraphs)
4. Professional closing

Return ONLY valid JSON (no other text):
{{
  "subject": "Re: Subject line",
  "body": "Full email body with appropriate formatting and line breaks"
}}

Generate the draft now:"""
    
    try:
        response = llm.invoke([HumanMessage(content=draft_prompt)])
        response_text = response.content.strip()
        
        # Extract JSON from response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            # Fallback if no JSON found
            return DraftReply(
                tone=tone,
                subject=f"Re: {original_subject}",
                body="Unable to generate draft. Please compose manually.",
                preview="Unable to generate draft.",
                timestamp=datetime.now().isoformat()
            )
        
        json_str = response_text[start_idx:end_idx]
        draft_data = json.loads(json_str)
        
        # Create DraftReply object
        body = draft_data.get('body', '')
        subject = draft_data.get('subject', f"Re: {original_subject}")
        preview = body[:100] + "..." if len(body) > 100 else body
        
        return DraftReply(
            tone=tone,
            subject=subject,
            body=body,
            preview=preview,
            timestamp=datetime.now().isoformat()
        )
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error in draft generation: {str(e)}")
        return DraftReply(
            tone=tone,
            subject=f"Re: {original_subject}",
            body="Error generating draft. Please compose manually.",
            preview="Error generating draft.",
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        print(f"Error generating draft reply: {str(e)}")
        return DraftReply(
            tone=tone,
            subject=f"Re: {original_subject}",
            body=f"Error: {str(e)}",
            preview=f"Error: {str(e)[:50]}",
            timestamp=datetime.now().isoformat()
        )

def generate_all_tone_variants(
    original_subject: str,
    original_sender: str,
    thread_content: str,
    context: Optional[str] = None
) -> dict:
    """
    Generate draft replies in all available tones for comparison.
    
    Returns:
        {
            "original_subject": str,
            "original_sender": str,
            "drafts": [DraftReply],
            "timestamp": str
        }
    """
    tones = ["professional", "friendly", "short", "apologetic"]
    drafts = []
    
    for tone in tones:
        draft = generate_draft_reply(
            original_subject,
            original_sender,
            thread_content,
            tone,
            context
        )
        drafts.append(draft)
    
    return {
        "original_subject": original_subject,
        "original_sender": original_sender,
        "drafts": drafts,
        "timestamp": datetime.now().isoformat(),
        "total_variants": len(drafts)
    }

def refine_draft(
    current_draft: str,
    feedback: str,
    tone: str = "professional"
) -> DraftReply:
    """
    Refine an existing draft based on user feedback.
    
    Args:
        current_draft: The current draft text
        feedback: User's refinement request
        tone: Tone to maintain
    
    Returns:
        Updated DraftReply
    """
    
    refine_prompt = f"""You are an email refinement assistant. 
    
Current draft:
{current_draft}

User feedback for refinement:
{feedback}

Tone to maintain: {tone}

Please refine the draft based on the feedback while maintaining the {tone} tone.
Return ONLY the refined email body (no JSON, just the plain text of the refined email):"""
    
    try:
        response = llm.invoke([HumanMessage(content=refine_prompt)])
        refined_body = response.content.strip()
        preview = refined_body[:100] + "..." if len(refined_body) > 100 else refined_body
        
        return DraftReply(
            tone=tone,
            subject="(Refined)",  # Subject doesn't change
            body=refined_body,
            preview=preview,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        print(f"Error refining draft: {str(e)}")
        return DraftReply(
            tone=tone,
            subject="(Refined)",
            body=current_draft,
            preview=current_draft[:100],
            timestamp=datetime.now().isoformat()
        )
