# test_classification.py
# Test script for Email Classification API

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://127.0.0.1:8000"

# Test emails
TEST_EMAILS = [
    {
        "id": 1,
        "subject": "Password Reset Request - URGENT",
        "sender": "john.doe@customer.com",
        "content": "Hi, I forgot my password and I need to access the system immediately. This is urgent as I have a client meeting in 30 minutes.",
        "timestamp": datetime.now().isoformat() + "Z"
    },
    {
        "id": 2,
        "subject": "Enterprise Solution Pricing Quote",
        "sender": "sales@newclient.com",
        "content": "We are interested in your enterprise solution. Could you send us a pricing quote and availability for a demo?",
        "timestamp": datetime.now().isoformat() + "Z"
    },
    {
        "id": 3,
        "subject": "Invoice #INV-2026-001 - Due Jan 31",
        "sender": "billing@paymentservice.com",
        "content": "Your invoice for January services is ready. Total amount: $5,000. Please process payment by January 31, 2026.",
        "timestamp": datetime.now().isoformat() + "Z"
    },
    {
        "id": 4,
        "subject": "API Integration Error - 500 Status Code",
        "sender": "dev.support@techclient.com",
        "content": "We are experiencing API integration errors. The endpoint returns a 500 status code. Can someone from support help us troubleshoot?",
        "timestamp": datetime.now().isoformat() + "Z"
    },
    {
        "id": 5,
        "subject": "Weekly Team Standup Summary - Jan 14",
        "sender": "team@company.com",
        "content": "Here is the summary of our weekly standup meeting. All projects are on track. No major blockers. Next meeting Friday.",
        "timestamp": datetime.now().isoformat() + "Z"
    },
    {
        "id": 6,
        "subject": "System Maintenance Alert",
        "sender": "billing@company.com",
        "content": "Please note that our billing system will undergo scheduled maintenance on January 20 from 2-4 PM EST. Plan accordingly.",
        "timestamp": datetime.now().isoformat() + "Z"
    }
]

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def test_single_email():
    """Test single email classification"""
    print_header("TEST 1: Single Email Classification")
    
    email = TEST_EMAILS[0]
    
    print(f"\nTesting email: {email['subject']}")
    print(f"From: {email['sender']}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/classify-email",
            json=email,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Classification Result:")
            print(f"   Category: {result['category']}")
            print(f"   Confidence: {result['confidence']:.2%}")
            print(f"   Reasoning: {result['reasoning']}")
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_batch_classification():
    """Test batch email classification"""
    print_header("TEST 2: Batch Email Classification")
    
    print(f"\nClassifying {len(TEST_EMAILS)} emails...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/classify-emails",
            json={"emails": TEST_EMAILS},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            classified_emails = result['classified_emails']
            stats = result['stats']
            
            print(f"\n✅ Batch Classification Complete:")
            print(f"\n📊 Statistics:")
            print(f"   Total Emails: {stats['total_emails']}")
            print(f"   Support: {stats['support']}")
            print(f"   Sales: {stats['sales']}")
            print(f"   Billing: {stats['billing']}")
            print(f"   Urgent: {stats['urgent']}")
            print(f"   FYI: {stats['fyi']}")
            
            print(f"\n📧 Classified Emails:")
            for email in classified_emails:
                print(f"   [{email['category']}] {email['subject'][:50]}")
            
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_stats():
    """Test getting classification statistics"""
    print_header("TEST 3: Get Classification Statistics")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/classification-stats",
            timeout=10
        )
        
        if response.status_code == 200:
            stats = response.json()
            print(f"\n✅ Statistics Retrieved:")
            print(f"   Total Emails: {stats['total_emails']}")
            print(f"   Support: {stats['support']}")
            print(f"   Sales: {stats['sales']}")
            print(f"   Billing: {stats['billing']}")
            print(f"   Urgent: {stats['urgent']}")
            print(f"   FYI: {stats['fyi']}")
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def test_api_health():
    """Test API health"""
    print_header("TEST 0: API Health Check")
    
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ API is running!")
            print(f"   Message: {result['message']}")
            return True
        else:
            print(f"\n❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ Cannot connect to API at {API_BASE_URL}")
        print(f"   Error: {str(e)}")
        print("\n   Make sure backend is running:")
        print("   uvicorn app:app --reload")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("  EMAIL CLASSIFICATION API - TEST SUITE")
    print("="*60)
    print(f"  Testing against: {API_BASE_URL}")
    print("="*60)
    
    results = []
    
    # Test health
    results.append(("API Health Check", test_api_health()))
    
    if not results[0][1]:
        print("\n❌ API is not running. Cannot proceed with tests.")
        return
    
    # Run other tests
    results.append(("Single Email Classification", test_single_email()))
    results.append(("Batch Email Classification", test_batch_classification()))
    results.append(("Get Statistics", test_stats()))
    
    # Summary
    print_header("TEST SUMMARY")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the output above.")

if __name__ == "__main__":
    run_all_tests()
