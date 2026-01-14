"use client";
import { MdEmail, MdSend, MdDelete, MdAdd, MdArchive } from "react-icons/md";
import React, { useState, useEffect } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const DUMMY_THREADS = [
  {
    id: 1,
    subject: "Q1 Budget Review Meeting",
    content: `From: Sarah Johnson <sarah@company.com>
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
I may be late by 15 mins, just a heads-up.`,
  },
  {
    id: 2,
    subject: "New Feature Development Timeline",
    content: `From: Alex Martinez <alex@company.com>
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
I'll coordinate the API endpoints. Will share documentation by Thursday.`,
  },
  {
    id: 3,
    subject: "Client Feedback on Proposal",
    content: `From: John Davis <john@client.com>
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
Also, could we have a trial period for our team to test the software before committing?`,
  },
  {
    id: 4,
    subject: "Marketing Campaign Plan",
    content: `From: Karen Lee <karen@marketing.com>
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
Perfect. Let's aim for internal review by Jan 20 to ensure everything is ready.`,
  },
];

export default function EmailSummarizer() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ subject: "", content: "" });

  useEffect(() => {
    const stored = localStorage.getItem("emailThreads");
    if (stored) {
      setThreads(JSON.parse(stored));
    } else {
      setThreads(DUMMY_THREADS);
      localStorage.setItem("emailThreads", JSON.stringify(DUMMY_THREADS));
    }
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch(`${apiUrl}/threads`);
        if (!res.ok) throw new Error("Failed to fetch threads");
        const data = await res.json();
        setThreads(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchThreads();
  }, [apiUrl]);

  const saveThreads = (updatedThreads) => {
    setThreads(updatedThreads);
    localStorage.setItem("emailThreads", JSON.stringify(updatedThreads));
  };

  const handleSummarize = async () => {
    if (!selectedThread) return;

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch(`${apiUrl}/summarize-thread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_content: selectedThread.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || "Failed to summarize thread");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = (id) => {
    const updated = threads.filter((t) => t.id !== id);
    saveThreads(updated);
    if (selectedThread?.id === id) {
      setSelectedThread(null);
      setSummary("");
    }
  };

  const handleAddThread = () => {
    if (!newThread.subject.trim() || !newThread.content.trim()) {
      setError("Please fill in both subject and content");
      return;
    }

    const newId = Math.max(...threads.map((t) => t.id), 0) + 1;
    const updated = [...threads, { ...newThread, id: newId }];
    saveThreads(updated);
    setNewThread({ subject: "", content: "" });
    setShowNewThread(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MdEmail size={32} />
                <div>
                  <h1 className="text-3xl font-bold">
                    Email Thread Summarizer
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    AI-powered email analysis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewThread(!showNewThread)}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                <MdAdd size={20} />
                New Thread
              </button>
            </div>
          </div>

          {/* API URL Config */}
          <div className="p-4 bg-gray-50 border-b">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Backend API URL:
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://localhost:8000"
            />
          </div>

          {/* New Thread Form */}
          {showNewThread && (
            <div className="p-6 bg-blue-50 border-b">
              <h3 className="font-semibold text-lg mb-4">
                Add New Email Thread
              </h3>
              <input
                type="text"
                value={newThread.subject}
                onChange={(e) =>
                  setNewThread({ ...newThread, subject: e.target.value })
                }
                placeholder="Subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={newThread.content}
                onChange={(e) =>
                  setNewThread({ ...newThread, content: e.target.value })
                }
                placeholder="Email thread content..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddThread}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Thread
                </button>
                <button
                  onClick={() => {
                    setShowNewThread(false);
                    setNewThread({ subject: "", content: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Thread List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Email Threads
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-4 rounded-lg cursor-pointer transition border-2 ${
                      selectedThread?.id === thread.id
                        ? "bg-blue-50 border-blue-500"
                        : "bg-gray-50 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedThread(thread);
                        setSummary("");
                        setError("");
                      }}
                      className="flex-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {thread.subject}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {thread.content.split("\n").length} messages
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(thread.id);
                      }}
                      className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      <MdDelete size={16} />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread Content & Summary */}
            <div className="lg:col-span-2">
              {selectedThread ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedThread.subject}
                    </h3>
                    <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {selectedThread.content}
                      </pre>
                    </div>
                  </div>

                  <button
                    onClick={handleSummarize}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                  >
                    {loading ? (
                      <>
                        <AiOutlineLoading3Quarters
                          className="animate-spin"
                          size={20}
                        />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <MdSend size={20} />
                        Summarize Thread
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {summary && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-lg mb-3 text-green-900 flex items-center gap-2">
                        <MdArchive size={20} />
                        Summary
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                          {summary}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MdEmail size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      Select an email thread to summarize
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
