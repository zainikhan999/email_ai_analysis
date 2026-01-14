"use client";
import React, { useState, useEffect } from "react";
import {
  MdEmail,
  MdLabel,
  MdCheckCircle,
  MdRefresh,
  MdFileDownload,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const CATEGORIES = [
  { name: "Support", color: "#3B82F6", icon: "🎯" },
  { name: "Sales", color: "#10B981", icon: "💼" },
  { name: "Billing", color: "#F59E0B", icon: "💳" },
  { name: "Urgent", color: "#EF4444", icon: "⚠️" },
  { name: "FYI", color: "#8B5CF6", icon: "ℹ️" },
];

export default function EmailClassifier() {
  const [emails, setEmails] = useState([]);
  const [classifiedEmails, setClassifiedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState(null);
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");

  // Sample emails for demonstration
  const SAMPLE_EMAILS = [
    {
      id: 1,
      subject: "Password Reset Request - Urgent",
      sender: "support@customer.com",
      content:
        "I've forgotten my password and need to reset it immediately. I have an important meeting in 30 minutes.",
      timestamp: "2026-01-14T10:30:00Z",
    },
    {
      id: 2,
      subject: "Q1 2026 Sales Proposal",
      sender: "john@newbusiness.com",
      content:
        "Hi, we are interested in your enterprise solutions. Could you send over pricing and availability details?",
      timestamp: "2026-01-14T09:15:00Z",
    },
    {
      id: 3,
      subject: "Invoice #INV-2026-001 - Payment Due",
      sender: "billing@paymentservice.com",
      content:
        "Your invoice for January services is now available. Total: $5,000. Due date: Jan 31, 2026",
      timestamp: "2026-01-14T08:45:00Z",
    },
    {
      id: 4,
      subject: "Weekly Team Standup Summary",
      sender: "team@company.com",
      content:
        "Here's a summary of our weekly standup. All projects are on track. No blockers to report.",
      timestamp: "2026-01-13T17:00:00Z",
    },
    {
      id: 5,
      subject: "API Integration Issue - Help Needed",
      sender: "dev.support@client.com",
      content:
        "We're experiencing integration errors with your API. Error code: 500. Can someone help troubleshoot?",
      timestamp: "2026-01-13T14:20:00Z",
    },
    {
      id: 6,
      subject: "Company Holiday Announcement",
      sender: "hr@company.com",
      content:
        "Please note that we will be closed for MLK Day on January 20th. The office will reopen on January 21st.",
      timestamp: "2026-01-13T12:00:00Z",
    },
  ];

  useEffect(() => {
    setEmails(SAMPLE_EMAILS);
  }, []);

  const handleClassifyEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/classify-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) throw new Error("Failed to classify emails");

      const data = await response.json();
      setClassifiedEmails(data.classified_emails);
      setStats(data.stats);
    } catch (err) {
      console.error("Classification error:", err);
      alert("Error classifying emails: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const filteredEmails = selectedCategory
    ? classifiedEmails.filter((e) => e.category === selectedCategory)
    : classifiedEmails;

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find((c) => c.name === category);
    return cat ? cat.color : "#6B7280";
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find((c) => c.name === category);
    return cat ? cat.icon : "📧";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <MdEmail className="text-blue-600" size={36} />
            Inbox Intelligence
          </h1>
          <p className="text-lg text-slate-600">
            Smart Email Classification for department@company.com
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 items-center justify-between flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API URL:
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://127.0.0.1:8000"
              />
            </div>
            <button
              onClick={handleClassifyEmails}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters
                    className="animate-spin"
                    size={20}
                  />
                  Classifying...
                </>
              ) : (
                <>
                  <MdRefresh size={20} />
                  Classify Emails
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.total_emails}
              </p>
            </div>
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="bg-white rounded-lg shadow p-4">
                <div
                  className="text-center cursor-pointer hover:opacity-80 transition"
                  onClick={() => filterByCategory(cat.name)}
                  style={{
                    opacity:
                      !selectedCategory || selectedCategory === cat.name
                        ? 1
                        : 0.5,
                  }}
                >
                  <p className="text-2xl mb-1" style={{ color: cat.color }}>
                    {cat.icon}
                  </p>
                  <p className="text-gray-600 text-xs font-medium">
                    {cat.name}
                  </p>
                  <p className="text-xl font-bold" style={{ color: cat.color }}>
                    {stats[cat.name.toLowerCase()]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emails List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedCategory ? `${selectedCategory} Emails` : "All Emails"}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-700 text-sm mt-2"
              >
                ← Show All
              </button>
            )}
          </div>

          {filteredEmails.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-6 hover:bg-slate-50 transition border-l-4"
                  style={{
                    borderLeftColor: getCategoryColor(email.category),
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {getCategoryIcon(email.category)}
                        </span>
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor: getCategoryColor(email.category),
                          }}
                        >
                          {email.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 break-words">
                        {email.subject}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        From:{" "}
                        <span className="font-medium">{email.sender}</span>
                      </p>
                      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                        {email.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-3">
                        {new Date(email.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <MdCheckCircle
                      className="text-green-500 flex-shrink-0"
                      size={24}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MdEmail className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">
                {classifiedEmails.length === 0
                  ? "Click 'Classify Emails' to get started"
                  : "No emails in this category"}
              </p>
            </div>
          )}
        </div>

        {/* Feature Description */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              ✨ Key Features
            </h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>
                  <strong>Smart Tagging:</strong> AI automatically categorizes
                  emails
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>
                  <strong>Reduce Overload:</strong> Quickly find important
                  emails
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>
                  <strong>Enable Routing:</strong> Route emails to right teams
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>
                  <strong>SLA Support:</strong> Set SLAs by email category
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              📊 Categories
            </h3>
            <ul className="space-y-3">
              {CATEGORIES.map((cat) => (
                <li key={cat.name} className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-slate-700">
                    <strong>{cat.name}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
