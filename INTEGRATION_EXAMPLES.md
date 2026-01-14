# INTEGRATION_EXAMPLES.md

# Email Classification Integration Examples

## Overview

This document shows how to integrate the Smart Email Classification system with your existing applications.

---

## 1. Direct API Integration (cURL)

### Classify a Single Email

```bash
curl -X POST http://127.0.0.1:8000/classify-email \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "subject": "Urgent: System Down",
    "sender": "ops@company.com",
    "content": "The production system is down. Please help immediately!"
  }'
```

**Response:**

```json
{
  "email_id": 1,
  "category": "Urgent",
  "confidence": 0.98,
  "reasoning": "Email contains urgent language and indicates system outage"
}
```

---

## 2. Python Integration

### Using the requests library

```python
import requests
import json

# Configuration
API_URL = "http://127.0.0.1:8000"

# Email to classify
email_data = {
    "id": 1,
    "subject": "Invoice #INV-2026-001",
    "sender": "billing@supplier.com",
    "content": "Please find attached invoice for January services",
    "timestamp": "2026-01-14T10:00:00Z"
}

# Make request
response = requests.post(
    f"{API_URL}/classify-email",
    json=email_data
)

# Process response
if response.status_code == 200:
    result = response.json()
    print(f"Category: {result['category']}")
    print(f"Confidence: {result['confidence']}")
else:
    print(f"Error: {response.status_code}")
```

### Batch Classification

```python
import requests

emails = [
    {
        "id": 1,
        "subject": "Help Needed",
        "sender": "customer@example.com",
        "content": "I cannot access my account",
        "timestamp": "2026-01-14T10:00:00Z"
    },
    {
        "id": 2,
        "subject": "Quote Request",
        "sender": "buyer@company.com",
        "content": "Can you provide pricing?",
        "timestamp": "2026-01-14T10:05:00Z"
    }
]

response = requests.post(
    "http://127.0.0.1:8000/classify-emails",
    json={"emails": emails}
)

if response.status_code == 200:
    result = response.json()
    for email in result['classified_emails']:
        print(f"{email['subject']} -> {email['category']}")

    print("\nStats:")
    print(f"Total: {result['stats']['total_emails']}")
    print(f"Urgent: {result['stats']['urgent']}")
    print(f"Support: {result['stats']['support']}")
```

---

## 3. JavaScript/Node.js Integration

### Using fetch API (React/Frontend)

```javascript
// Classify single email
async function classifyEmail(email) {
  try {
    const response = await fetch("http://127.0.0.1:8000/classify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    });

    if (!response.ok) throw new Error("Classification failed");

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Usage
const email = {
  id: 1,
  subject: "Technical Support Request",
  sender: "user@example.com",
  content: "The API keeps returning 500 errors",
};

classifyEmail(email).then((result) => {
  console.log(`Category: ${result.category}`);
  console.log(`Confidence: ${result.confidence}`);
});
```

### Using axios (Node.js)

```javascript
const axios = require("axios");

async function classifyEmails(emails) {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/classify-emails",
      { emails },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Usage
const emails = [
  {
    id: 1,
    subject: "Invoice",
    sender: "billing@company.com",
    content: "Payment due",
    timestamp: new Date().toISOString(),
  },
];

classifyEmails(emails).then((result) => {
  console.log(result.stats);
});
```

---

## 4. Email Provider Integration

### Gmail API Integration (Pseudo-code)

```python
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.auth.oauthlib.flow import InstalledAppFlow
from google.api_core.client_options import ClientOptions
from google.cloud import gmail_v1
import requests

def get_gmail_emails(limit=10):
    """Fetch emails from Gmail"""
    service = gmail_v1.build('gmail', 'v1', credentials=credentials)

    results = service.users().messages().list(
        userId='me',
        maxResults=limit
    ).execute()

    messages = results.get('messages', [])

    emails = []
    for message in messages:
        msg = service.users().messages().get(
            userId='me',
            id=message['id']
        ).execute()

        headers = msg['payload']['headers']
        emails.append({
            'id': message['id'],
            'subject': next(h['value'] for h in headers if h['name'] == 'Subject'),
            'sender': next(h['value'] for h in headers if h['name'] == 'From'),
            'content': msg['snippet'],
            'timestamp': msg['internalDate']
        })

    return emails

def classify_gmail_emails():
    """Get and classify Gmail emails"""
    emails = get_gmail_emails()

    # Send to classification API
    response = requests.post(
        'http://127.0.0.1:8000/classify-emails',
        json={'emails': emails}
    )

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
```

### Outlook Integration (Pseudo-code)

```python
from office365.graph_client import GraphClient
import requests

def get_outlook_emails(limit=10):
    """Fetch emails from Outlook"""
    client = GraphClient(token=access_token)

    messages = client.me.mail_folders.get_by_id('inbox').messages.get().execute()

    emails = []
    for message in messages[:limit]:
        emails.append({
            'id': message.id,
            'subject': message.subject,
            'sender': message.from_.email_address.address,
            'content': message.body_preview,
            'timestamp': message.received_date_time.isoformat()
        })

    return emails

def classify_outlook_emails():
    """Get and classify Outlook emails"""
    emails = get_outlook_emails()

    response = requests.post(
        'http://127.0.0.1:8000/classify-emails',
        json={'emails': emails}
    )

    return response.json()
```

---

## 5. Webhook Integration

### Receive Classifications via Webhook

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

WEBHOOK_URL = "http://your-app.com/webhooks/email-classified"

@app.post("/webhooks/email-classified")
async def handle_classification(data: dict):
    """
    Receives classification results from external source
    """
    email_id = data['email_id']
    category = data['category']
    confidence = data['confidence']

    # Process based on category
    if category == "Urgent":
        # Alert immediately
        send_alert(f"Urgent email: {email_id}")
    elif category == "Support":
        # Route to support queue
        route_to_support(email_id)
    elif category == "Sales":
        # Notify sales team
        notify_sales(email_id)
    elif category == "Billing":
        # Route to billing
        route_to_billing(email_id)
    elif category == "FYI":
        # Archive
        archive_email(email_id)

    return {"status": "processed"}
```

---

## 6. Database Storage

### Save Classifications to Database

```python
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class ClassifiedEmail(Base):
    __tablename__ = "classified_emails"

    id = Column(String, primary_key=True)
    subject = Column(String)
    sender = Column(String)
    category = Column(String)
    confidence = Column(Float)
    classified_at = Column(DateTime, default=datetime.now)

# Create session
engine = create_engine('sqlite:///emails.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

def save_classification(email_id, subject, sender, category, confidence):
    """Save classification to database"""
    session = Session()

    classified_email = ClassifiedEmail(
        id=email_id,
        subject=subject,
        sender=sender,
        category=category,
        confidence=confidence
    )

    session.add(classified_email)
    session.commit()
    session.close()

# Usage
import requests

response = requests.post(
    'http://127.0.0.1:8000/classify-email',
    json=email_data
)

if response.status_code == 200:
    result = response.json()
    save_classification(
        result['email_id'],
        email_data['subject'],
        email_data['sender'],
        result['category'],
        result['confidence']
    )
```

---

## 7. Email Routing Pipeline

### Auto-Route Based on Classification

```python
import requests
from datetime import datetime

class EmailRouter:
    def __init__(self, classification_api_url):
        self.api_url = classification_api_url
        self.routes = {
            "Support": "support@company.com",
            "Sales": "sales@company.com",
            "Billing": "billing@company.com",
            "Urgent": "urgent-queue@company.com",
            "FYI": "archive@company.com"
        }

    def classify_and_route(self, email):
        """Classify email and route to appropriate queue"""

        # Get classification
        response = requests.post(
            f"{self.api_url}/classify-email",
            json=email
        )

        if response.status_code != 200:
            raise Exception(f"Classification failed: {response.text}")

        result = response.json()
        category = result['category']

        # Route based on category
        destination = self.routes.get(category, "unclassified@company.com")

        return {
            "email_id": email['id'],
            "original_to": email.get('to'),
            "routed_to": destination,
            "category": category,
            "confidence": result['confidence'],
            "timestamp": datetime.now().isoformat()
        }

# Usage
router = EmailRouter("http://127.0.0.1:8000")

email = {
    "id": 1,
    "subject": "Server Error Help",
    "sender": "customer@example.com",
    "content": "Getting 500 errors",
    "to": "support@company.com"
}

routing_result = router.classify_and_route(email)
print(f"Routed to: {routing_result['routed_to']}")
```

---

## 8. Real-time Monitoring Dashboard

### Stream Classifications

```javascript
// React component for real-time monitoring

import React, { useState, useEffect } from "react";

export default function MonitoringDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        "http://127.0.0.1:8000/classification-stats"
      );
      const data = await response.json();
      setStats(data);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h2>Real-time Email Classification</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
          <p>{stats.total_emails}</p>
        </div>
        <div className="stat-card urgent">
          <h3>Urgent</h3>
          <p>{stats.urgent}</p>
        </div>
        <div className="stat-card support">
          <h3>Support</h3>
          <p>{stats.support}</p>
        </div>
        <div className="stat-card sales">
          <h3>Sales</h3>
          <p>{stats.sales}</p>
        </div>
        <div className="stat-card billing">
          <h3>Billing</h3>
          <p>{stats.billing}</p>
        </div>
        <div className="stat-card fyi">
          <h3>FYI</h3>
          <p>{stats.fyi}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. Error Handling & Retry Logic

### Robust API Calls

```python
import requests
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def get_session_with_retries():
    """Create requests session with automatic retries"""
    session = requests.Session()

    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    return session

def classify_with_retry(email, max_attempts=3):
    """Classify email with retry logic"""
    session = get_session_with_retries()

    for attempt in range(max_attempts):
        try:
            response = session.post(
                'http://127.0.0.1:8000/classify-email',
                json=email,
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code >= 500:
                raise Exception(f"Server error: {response.status_code}")
            else:
                raise Exception(f"Client error: {response.status_code}")

        except requests.exceptions.Timeout:
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt
                print(f"Timeout. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise Exception("Max retries exceeded")

        except Exception as e:
            if attempt < max_attempts - 1:
                wait_time = 2 ** attempt
                print(f"Error: {str(e)}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise

# Usage
try:
    result = classify_with_retry(email_data)
    print(f"Classification: {result['category']}")
except Exception as e:
    print(f"Failed after retries: {str(e)}")
```

---

## 10. Performance Optimization

### Batch Processing with Queue

```python
import queue
import threading
from concurrent.futures import ThreadPoolExecutor
import requests

class EmailClassificationQueue:
    def __init__(self, batch_size=10, workers=3):
        self.queue = queue.Queue()
        self.batch_size = batch_size
        self.results = []
        self.executor = ThreadPoolExecutor(max_workers=workers)

    def add_email(self, email):
        """Add email to classification queue"""
        self.queue.put(email)

    def process_batch(self):
        """Process emails in batch"""
        batch = []

        while not self.queue.empty() and len(batch) < self.batch_size:
            batch.append(self.queue.get())

        if batch:
            future = self.executor.submit(self._classify_batch, batch)
            return future

    def _classify_batch(self, emails):
        """Classify batch of emails"""
        response = requests.post(
            'http://127.0.0.1:8000/classify-emails',
            json={'emails': emails}
        )

        if response.status_code == 200:
            result = response.json()
            self.results.extend(result['classified_emails'])
            return result
        else:
            raise Exception(f"Batch classification failed: {response.status_code}")

    def get_results(self):
        """Get all classification results"""
        return self.results

# Usage
router = EmailClassificationQueue(batch_size=20, workers=5)

# Add emails
for email in incoming_emails:
    router.add_email(email)

# Process batches
while not router.queue.empty():
    future = router.process_batch()
    if future:
        future.result()  # Wait for batch to complete

results = router.get_results()
```

---

## Summary

These examples show how to:

- ✅ Call the API directly
- ✅ Integrate with Python, JavaScript, Node.js
- ✅ Connect to Gmail and Outlook
- ✅ Set up webhooks
- ✅ Store classifications in databases
- ✅ Route emails automatically
- ✅ Monitor in real-time
- ✅ Handle errors gracefully
- ✅ Optimize performance

**Choose the integration method that best fits your application!**
