# app.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # Add this line
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from email_classifier import classify_email, get_inbox_statistics
from action_item_extractor import extract_action_items, batch_extract_action_items
from draft_reply_generator import generate_draft_reply, generate_all_tone_variants, refine_draft
from typing import List, Optional

# Load .env
load_dotenv()

# Read API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

# Initialize FastAPI app
app = FastAPI(title="Email Thread Summarizer")


# Allow frontend to access backend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # or ["*"] for development
    allow_credentials=True,
    allow_methods=["*"],     # allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)
# Initialize LLM
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=1,
    api_key=GROQ_API_KEY
)

DUMMY_THREADS = [
    {
        "id": 1,
        "subject": "Q1 Budget Review Meeting",
        "content": """From: Sarah Johnson <sarah@company.com>
To: Team <team@company.com>
Date: Jan 10, 2026

Hi team,
We need to schedule our Q1 budget review. I propose next Wednesday at 2 PM. Please confirm your availability.

---
From: Mike Chen <mike@company.com>
To: Sarah Johnson <sarah@company.com>
Date: Jan 11, 2026
Wednesday works for me. Should we invite the finance team?

---
From: Sarah Johnson <sarah@company.com>
To: Mike Chen <mike@company.com>
Date: Jan 11, 2026
Yes, good idea. I'll send them an invite. Can you prepare the expense report?

---
From: Mike Chen <mike@company.com>
To: Sarah Johnson <sarah@company.com>
Date: Jan 12, 2026
Will do. I'll have it ready by Tuesday.

---
From: Anna Patel <anna@company.com>
To: Sarah Johnson <sarah@company.com>
Date: Jan 12, 2026
I may be late by 15 mins, just a heads-up."""
    },
    {
        "id": 2,
        "subject": "New Feature Development Timeline",
        "content": """From: Alex Martinez <alex@company.com>
To: Dev Team <dev@company.com>
Date: Jan 8, 2026

Team,
We need to finalize the timeline for the new user dashboard feature. Let's outline key milestones.

---
From: Emma Wilson <emma@company.com>
To: Alex Martinez <alex@company.com>
Date: Jan 9, 2026
I think we can deliver the MVP in 3 weeks. However, we need clarification on the authentication flow. Are we using OAuth2 or a custom system?

---
From: Alex Martinez <alex@company.com>
To: Emma Wilson <emma@company.com>
Date: Jan 9, 2026
Let's use OAuth2. Can you start on the UI mockups while we finalize the backend specs?

---
From: Emma Wilson <emma@company.com>
To: Alex Martinez <alex@company.com>
Date: Jan 10, 2026
Sounds good. I'll have mockups ready by Friday.

---
From: Rajiv Singh <rajiv@company.com>
To: Alex Martinez <alex@company.com>
Date: Jan 10, 2026
I’ll coordinate the API endpoints. Will share documentation by Thursday."""
    },
    {
        "id": 3,
        "subject": "Client Feedback on Proposal",
        "content": """From: John Davis <john@client.com>
To: Lisa Brown <lisa@company.com>
Date: Jan 5, 2026

Lisa,
Thanks for the proposal. Overall looks good, but we have concerns about the pricing structure.

---
From: Lisa Brown <lisa@company.com>
To: John Davis <john@client.com>
Date: Jan 6, 2026
Thanks for the feedback. What specific concerns do you have? We're open to discussing adjustments.

---
From: John Davis <john@client.com>
To: Lisa Brown <lisa@company.com>
Date: Jan 7, 2026
The licensing fees seem high compared to competitors. Can we negotiate a volume discount?

---
From: Lisa Brown <lisa@company.com>
To: John Davis <john@client.com>
Date: Jan 8, 2026
Let me discuss with our pricing team. I'll get back to you by Wednesday with options.

---
From: John Davis <john@client.com>
To: Lisa Brown <lisa@company.com>
Date: Jan 9, 2026
Also, could we have a trial period for our team to test the software before committing?"""
    },
    {
        "id": 4,
        "subject": "Marketing Campaign Plan",
        "content": """From: Karen Lee <karen@marketing.com>
To: Marketing Team <marketing@company.com>
Date: Jan 7, 2026

Team,
We need to launch the new social media campaign by Feb 1. Please review the content calendar attached.

---
From: Daniel Kim <daniel@marketing.com>
To: Karen Lee <karen@marketing.com>
Date: Jan 8, 2026
I've checked the calendar. We might need more graphics for Instagram posts. I'll coordinate with the design team.

---
From: Sophia Martinez <sophia@marketing.com>
To: Karen Lee <karen@marketing.com>
Date: Jan 8, 2026
I can handle scheduling the posts. Will need final content by Jan 25.

---
From: Karen Lee <karen@marketing.com>
To: All <marketing@company.com>
Date: Jan 9, 2026
Perfect. Let's aim for internal review by Jan 20 to ensure everything is ready."""
    }
]

# Request body model
class EmailThreadRequest(BaseModel):
    thread_content: str

class EmailForClassification(BaseModel):
    id: int
    subject: str
    sender: str
    content: str
    timestamp: str

class ClassifyEmailsRequest(BaseModel):
    emails: List[EmailForClassification]

class ClassificationResult(BaseModel):
    id: int
    subject: str
    sender: str
    content: str
    timestamp: str
    category: str

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Email Thread Summarizer is running."}

# Endpoint for summarizing email threads
@app.post("/summarize-thread")
async def summarize_thread(request: EmailThreadRequest):
    if not request.thread_content.strip():
        raise HTTPException(status_code=400, detail="Email thread cannot be empty")
    
    prompt = f"""
Summarize the following email thread at the top level:
- Highlight Decisions
- Highlight Action Items
- Highlight Open Questions

Email Thread:
{request.thread_content}
"""
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return {"summary": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/threads")
async def get_threads():
    return DUMMY_THREADS

# ============= EMAIL CLASSIFICATION ENDPOINTS =============

@app.post("/classify-email")
async def classify_single_email(request: EmailForClassification):
    """
    Classify a single email into Support, Sales, Billing, Urgent, or FYI.
    """
    try:
        result = classify_email(request.subject, request.sender, request.content)
        return {
            "email_id": request.id,
            "category": result.category,
            "confidence": result.confidence,
            "reasoning": result.reasoning
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify-emails")
async def classify_multiple_emails(request: ClassifyEmailsRequest):
    """
    Classify multiple emails and return classified emails with statistics.
    """
    try:
        classified_emails = []
        
        for email in request.emails:
            classification_result = classify_email(
                email.subject, 
                email.sender, 
                email.content
            )
            
            classified_emails.append({
                "id": email.id,
                "subject": email.subject,
                "sender": email.sender,
                "content": email.content,
                "timestamp": email.timestamp,
                "category": classification_result.category
            })
        
        # Calculate statistics
        stats = {
            "total_emails": len(classified_emails),
            "support": len([e for e in classified_emails if e["category"] == "Support"]),
            "sales": len([e for e in classified_emails if e["category"] == "Sales"]),
            "billing": len([e for e in classified_emails if e["category"] == "Billing"]),
            "urgent": len([e for e in classified_emails if e["category"] == "Urgent"]),
            "fyi": len([e for e in classified_emails if e["category"] == "FYI"])
        }
        
        return {
            "classified_emails": classified_emails,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/classification-stats")
async def get_classification_stats():
    """
    Get classification statistics for the current threads.
    """
    try:
        stats = {
            "total_emails": len(DUMMY_THREADS),
            "support": 0,
            "sales": 0,
            "billing": 0,
            "urgent": 0,
            "fyi": 0
        }
        
        for thread in DUMMY_THREADS:
            classification_result = classify_email(
                thread.get("subject", ""),
                thread.get("sender", "Unknown"),
                thread.get("content", "")
            )
            
            category = classification_result.category.lower()
            if category in stats:
                stats[category] += 1
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= ACTION ITEM EXTRACTION ENDPOINTS =============

@app.post("/extract-action-items")
async def extract_actions_from_email(request: dict):
    """
    Extract action items from a single email.
    
    Identifies tasks, deadlines, requests, and ownership clues.
    AI suggests: task title, due date, priority, suggested assignee.
    User confirms extraction.
    """
    try:
        email_id = request.get('email_id', 0)
        subject = request.get('subject', '')
        sender = request.get('sender', '')
        content = request.get('content', '')
        
        action_items = extract_action_items(subject, sender, content)
        
        return {
            "email_id": email_id,
            "subject": subject,
            "action_items": [
                {
                    "id": item.id,
                    "title": item.title,
                    "description": item.description,
                    "due_date": item.due_date,
                    "priority": item.priority,
                    "suggested_assignee": item.suggested_assignee,
                    "confidence": item.confidence,
                    "reasoning": item.reasoning,
                    "status": item.status
                }
                for item in action_items
            ],
            "total_items": len(action_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-action-items-batch")
async def extract_actions_batch(request: dict):
    """
    Extract action items from multiple emails.
    
    Returns all extracted action items with statistics.
    """
    try:
        emails = request.get('emails', [])
        print(f"DEBUG: Received {len(emails)} emails for batch processing")
        
        result = batch_extract_action_items(emails)
        print(f"DEBUG: Batch processing completed, got {result['total_items']} total items")
        
        # Convert response objects to dicts for JSON serialization
        results_dicts = []
        for res in result['results']:
            results_dicts.append({
                "email_id": res.email_id,
                "subject": res.subject,
                "action_items": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "description": item.description,
                        "due_date": item.due_date,
                        "priority": item.priority,
                        "suggested_assignee": item.suggested_assignee,
                        "confidence": item.confidence,
                        "reasoning": item.reasoning,
                        "status": item.status
                    }
                    for item in res.action_items
                ],
                "total_items": res.total_items
            })
        
        return {
            "results": results_dicts,
            "total_items": result['total_items'],
            "high_priority_count": result['high_priority_count']
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR in extract_actions_batch: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.get("/action-items-stats")
async def get_action_items_stats():
    """
    Get statistics about action items across all emails.
    """
    try:
        # This would connect to a database in production
        # For now, return template structure
        return {
            "total_action_items": 0,
            "by_priority": {
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "by_status": {
                "pending": 0,
                "confirmed": 0,
                "rejected": 0
            },
            "average_confidence": 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= DRAFT REPLY GENERATION ENDPOINTS =============

@app.post("/draft-reply")
async def draft_email_reply(request: dict):
    """
    Generate a single draft reply with specified tone.
    
    Request body:
    {
        "original_subject": "Subject of email",
        "original_sender": "sender@email.com",
        "thread_content": "Full email thread",
        "tone": "professional|friendly|short|apologetic",
        "context": "Optional organization context"
    }
    """
    try:
        original_subject = request.get('original_subject', 'Re: Email')
        original_sender = request.get('original_sender', '')
        thread_content = request.get('thread_content', '')
        tone = request.get('tone', 'professional')
        context = request.get('context')
        
        print(f"DEBUG: Generating draft reply with tone: {tone}")
        
        draft = generate_draft_reply(
            original_subject,
            original_sender,
            thread_content,
            tone,
            context
        )
        
        return {
            "tone": draft.tone,
            "subject": draft.subject,
            "body": draft.body,
            "preview": draft.preview,
            "timestamp": draft.timestamp
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR in draft_email_reply: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/draft-reply-all-tones")
async def draft_email_all_tones(request: dict):
    """
    Generate draft replies in all available tones for comparison.
    
    Request body:
    {
        "original_subject": "Subject of email",
        "original_sender": "sender@email.com",
        "thread_content": "Full email thread",
        "context": "Optional organization context"
    }
    """
    try:
        original_subject = request.get('original_subject', 'Re: Email')
        original_sender = request.get('original_sender', '')
        thread_content = request.get('thread_content', '')
        context = request.get('context')
        
        print(f"DEBUG: Generating draft replies for all tones")
        
        result = generate_all_tone_variants(
            original_subject,
            original_sender,
            thread_content,
            context
        )
        
        return {
            "original_subject": result['original_subject'],
            "original_sender": result['original_sender'],
            "drafts": [
                {
                    "tone": draft.tone,
                    "subject": draft.subject,
                    "body": draft.body,
                    "preview": draft.preview,
                    "timestamp": draft.timestamp
                }
                for draft in result['drafts']
            ],
            "total_variants": result['total_variants'],
            "timestamp": result['timestamp']
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR in draft_email_all_tones: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/refine-draft")
async def refine_draft_reply(request: dict):
    """
    Refine an existing draft based on user feedback.
    
    Request body:
    {
        "current_draft": "Current draft text",
        "feedback": "User's refinement request",
        "tone": "professional|friendly|short|apologetic"
    }
    """
    try:
        current_draft = request.get('current_draft', '')
        feedback = request.get('feedback', '')
        tone = request.get('tone', 'professional')
        
        print(f"DEBUG: Refining draft with feedback: {feedback[:50]}...")
        
        refined = refine_draft(current_draft, feedback, tone)
        
        return {
            "tone": refined.tone,
            "body": refined.body,
            "preview": refined.preview,
            "timestamp": refined.timestamp
        }
    except Exception as e:
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f"ERROR in refine_draft_reply: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

