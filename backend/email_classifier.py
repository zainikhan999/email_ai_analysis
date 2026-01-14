# email_classifier.py
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from typing import List, Optional

# Load .env
load_dotenv()

# Initialize LLM for classification
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,  # Lower temperature for consistent classification
    api_key=GROQ_API_KEY
)

# Classification categories
CLASSIFICATION_CATEGORIES = ["Support", "Sales", "Billing", "Urgent", "FYI"]

class Email(BaseModel):
    id: int
    subject: str
    sender: str
    content: str
    category: Optional[str] = None
    timestamp: str

class EmailClassificationRequest(BaseModel):
    email_id: int
    subject: str
    sender: str
    content: str

class ClassificationResponse(BaseModel):
    email_id: int
    category: str
    confidence: float
    reasoning: str

class InboxStats(BaseModel):
    total_emails: int
    support: int
    sales: int
    billing: int
    urgent: int
    fyi: int

def classify_email(subject: str, sender: str, content: str) -> ClassificationResponse:
    """
    Classify an email into one of the predefined categories using AI.
    
    Categories:
    - Support: Customer support, technical issues, troubleshooting
    - Sales: Sales inquiries, proposals, opportunities, pricing
    - Billing: Invoices, payments, subscriptions, billing issues
    - Urgent: Time-sensitive, requires immediate action
    - FYI: Informational, announcements, updates, no action needed
    """
    
    classification_prompt = f"""You are an email classification AI for a company inbox. Classify the following email into ONE category: Support, Sales, Billing, Urgent, or FYI.

Email Subject: {subject}
From: {sender}
Content: {content}

Rules for classification:
1. Support - Customer support requests, technical issues, troubleshooting, help requests
2. Sales - Sales inquiries, new business opportunities, proposals, pricing discussions, contracts
3. Billing - Invoices, payment confirmations, subscription changes, billing disputes, payment requests
4. Urgent - Time-sensitive content, requires immediate action, deadlines mentioned, emergency situations
5. FYI - Informational emails, announcements, updates, meeting summaries, no action needed

Important: An email can only be ONE category. If it fits multiple, choose the PRIMARY category.

Respond in this exact JSON format:
{{
    "category": "Category name",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this email was classified this way"
}}"""
    
    try:
        response = llm.invoke([HumanMessage(content=classification_prompt)])
        
        # Parse the response
        import json
        response_text = response.content
        
        # Extract JSON from response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        json_str = response_text[start_idx:end_idx]
        
        result = json.loads(json_str)
        
        return ClassificationResponse(
            email_id=0,  # Will be set by caller
            category=result.get("category", "FYI"),
            confidence=result.get("confidence", 0.5),
            reasoning=result.get("reasoning", "")
        )
    except Exception as e:
        print(f"Error classifying email: {str(e)}")
        # Default to FYI if classification fails
        return ClassificationResponse(
            email_id=0,
            category="FYI",
            confidence=0.0,
            reasoning=f"Classification failed, defaulted to FYI. Error: {str(e)}"
        )

def batch_classify_emails(emails: List[Email]) -> List[Email]:
    """
    Classify multiple emails and return them with categories assigned.
    """
    classified_emails = []
    
    for email in emails:
        classification = classify_email(email.subject, email.sender, email.content)
        email.category = classification.category
        classified_emails.append(email)
    
    return classified_emails

def get_inbox_statistics(emails: List[Email]) -> InboxStats:
    """
    Calculate statistics about classified emails.
    """
    stats = InboxStats(
        total_emails=len(emails),
        support=0,
        sales=0,
        billing=0,
        urgent=0,
        fyi=0
    )
    
    for email in emails:
        if email.category == "Support":
            stats.support += 1
        elif email.category == "Sales":
            stats.sales += 1
        elif email.category == "Billing":
            stats.billing += 1
        elif email.category == "Urgent":
            stats.urgent += 1
        elif email.category == "FYI":
            stats.fyi += 1
    
    return stats
