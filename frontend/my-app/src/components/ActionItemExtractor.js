"use client";
import React, { useState, useEffect } from "react";
import {
  MdChecklistRtl,
  MdRefresh,
  MdDelete,
  MdCheckCircle,
  MdSchedule,
  MdPersonAdd,
  MdPriorityHigh,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const SAMPLE_EMAILS = [
  {
    id: 1,
    subject: "Q1 Budget Review - Action Needed",
    sender: "sarah@company.com",
    content:
      "Hi team, Can you send the Q1 budget report by Friday? We need it for the board meeting on Monday. Please also prepare the expense breakdown. Mike, can you review the numbers? Thanks!",
    timestamp: "2026-01-14T10:30:00Z",
  },
  {
    id: 2,
    subject: "Urgent: Server Down - Help Needed ASAP",
    sender: "ops@company.com",
    content:
      "Our production server is down! This is critical. Can someone restart the application server immediately? Also, please investigate why the monitoring alerts failed. We need a root cause analysis by end of day.",
    timestamp: "2026-01-14T09:15:00Z",
  },
  {
    id: 3,
    subject: "Invoice Needs Review",
    sender: "accounting@vendor.com",
    content:
      "Please review and approve invoice #INV-12345 by end of week. The amount is $15,000. Also, can you update the project code in our system?",
    timestamp: "2026-01-14T08:45:00Z",
  },
  {
    id: 4,
    subject: "Project Status & Next Steps",
    sender: "alex@company.com",
    content:
      "The new dashboard feature is on track. We need to schedule a design review for next Wednesday. Can everyone who worked on the UI mockups send their feedback by Tuesday? Also, we should discuss the authentication flow before Friday.",
    timestamp: "2026-01-13T17:00:00Z",
  },
  {
    id: 5,
    subject: "Action Items from Today's Meeting",
    sender: "john@company.com",
    content:
      "Here are the action items from our meeting: 1) Sarah needs to send the proposal to the client by tomorrow. 2) Tom should prepare the technical documentation. 3) Can everyone review the design by Thursday? 4) Please don't forget to submit your timesheets by Friday!",
    timestamp: "2026-01-13T14:20:00Z",
  },
];

const PRIORITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#3B82F6",
};

const PRIORITY_ICONS = {
  high: "🔴",
  medium: "🟡",
  low: "🔵",
};

export default function ActionItemExtractor() {
  const [emails, setEmails] = useState(SAMPLE_EMAILS);
  const [extractedItems, setExtractedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");
  const [confirmedItems, setConfirmedItems] = useState(new Set());

  const handleExtractActionItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/extract-action-items-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) throw new Error("Failed to extract action items");

      const data = await response.json();

      // Flatten all action items with email context and unique IDs
      const flattened = [];
      let globalIndex = 0;
      for (const result of data.results) {
        for (const item of result.action_items) {
          flattened.push({
            ...item,
            uniqueId: `${result.email_id}-${globalIndex}`, // Create unique ID
            id: `${result.email_id}-${globalIndex}`, // Override the backend ID
            email_id: result.email_id,
            email_subject: result.subject,
          });
          globalIndex++;
        }
      }

      setExtractedItems(flattened);
      setConfirmedItems(new Set()); // Reset confirmed items
    } catch (err) {
      console.error("Extraction error:", err);
      alert("Error extracting action items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmItem = (itemId) => {
    const newConfirmed = new Set(confirmedItems);
    if (newConfirmed.has(itemId)) {
      newConfirmed.delete(itemId);
    } else {
      newConfirmed.add(itemId);
    }
    setConfirmedItems(newConfirmed);
  };

  const deleteItem = (itemId) => {
    setExtractedItems(extractedItems.filter((item) => item.id !== itemId));
  };

  const filteredItems = selectedPriority
    ? extractedItems.filter((item) => item.priority === selectedPriority)
    : extractedItems;

  const highPriorityCount = extractedItems.filter(
    (item) => item.priority === "high"
  ).length;
  const confirmedCount = confirmedItems.size;
  const allCount = extractedItems.length;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8"
      suppressHydrationWarning
    >
      <div className="max-w-6xl mx-auto" suppressHydrationWarning>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <MdChecklistRtl className="text-orange-600" size={36} />
            Action Item Extraction
          </h1>
          <p className="text-lg text-slate-600">
            AI suggests tasks, deadlines, priorities & assignees. You confirm!
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="http://127.0.0.1:8000"
              />
            </div>
            <button
              onClick={handleExtractActionItems}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters
                    className="animate-spin"
                    size={20}
                  />
                  Extracting...
                </>
              ) : (
                <>
                  <MdRefresh size={20} />
                  Extract Action Items
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {extractedItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm font-medium">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{allCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm font-medium">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {highPriorityCount}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm font-medium">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {confirmedCount}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-blue-600">
                {allCount - confirmedCount}
              </p>
            </div>
          </div>
        )}

        {/* Priority Filters */}
        {extractedItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Filter by Priority:
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedPriority(null)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedPriority === null
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                }`}
              >
                All Items ({allCount})
              </button>
              <button
                onClick={() => setSelectedPriority("high")}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedPriority === "high"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-900 hover:bg-red-200"
                }`}
              >
                🔴 High Priority
              </button>
              <button
                onClick={() => setSelectedPriority("medium")}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedPriority === "medium"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
              >
                🟡 Medium Priority
              </button>
              <button
                onClick={() => setSelectedPriority("low")}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  selectedPriority === "low"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                }`}
              >
                🔵 Low Priority
              </button>
            </div>
          </div>
        )}

        {/* Action Items List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedPriority
                ? `${
                    selectedPriority.charAt(0).toUpperCase() +
                    selectedPriority.slice(1)
                  } Priority Items`
                : "Extracted Action Items"}
            </h2>
            {selectedPriority && (
              <button
                onClick={() => setSelectedPriority(null)}
                className="text-orange-600 hover:text-orange-700 text-sm mt-2"
              >
                ← Show All
              </button>
            )}
          </div>

          {filteredItems.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredItems.map((item) => {
                const isConfirmed = confirmedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-6 transition border-l-4 ${
                      isConfirmed ? "bg-green-50" : "hover:bg-slate-50"
                    }`}
                    style={{
                      borderLeftColor: PRIORITY_COLORS[item.priority],
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {PRIORITY_ICONS[item.priority]}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">
                            {item.title}
                          </h3>
                          {isConfirmed && (
                            <span className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                              CONFIRMED
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-slate-700 mb-3">
                            {item.description}
                          </p>
                        )}

                        <p className="text-xs text-slate-600 mb-2">
                          📧 From email:{" "}
                          <span className="font-medium">
                            {item.email_subject}
                          </span>
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                          {item.due_date && (
                            <div className="flex items-center gap-2">
                              <MdSchedule
                                className="text-orange-600"
                                size={18}
                              />
                              <span className="text-sm">
                                <strong>Due:</strong> {item.due_date}
                              </span>
                            </div>
                          )}

                          {item.suggested_assignee && (
                            <div className="flex items-center gap-2">
                              <MdPersonAdd
                                className="text-blue-600"
                                size={18}
                              />
                              <span className="text-sm">
                                <strong>Suggest:</strong>{" "}
                                {item.suggested_assignee}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <MdPriorityHigh
                              size={18}
                              style={{ color: PRIORITY_COLORS[item.priority] }}
                            />
                            <span className="text-sm">
                              <strong>Priority:</strong>{" "}
                              {item.priority.charAt(0).toUpperCase() +
                                item.priority.slice(1)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">
                              <strong>Confidence:</strong>{" "}
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded border-l-2 border-slate-300 mb-3">
                          <p className="text-xs text-slate-700">
                            <strong>Why AI suggested this:</strong>{" "}
                            {item.reasoning}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => confirmItem(item.id)}
                          className={`p-2 rounded-lg transition ${
                            isConfirmed
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                          }`}
                          title={
                            isConfirmed
                              ? "Remove confirmation"
                              : "Confirm this action item"
                          }
                        >
                          <MdCheckCircle size={24} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                          title="Delete this item"
                        >
                          <MdDelete size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MdChecklistRtl
                className="mx-auto text-slate-400 mb-4"
                size={48}
              />
              <p className="text-slate-600">
                {extractedItems.length === 0
                  ? "Click 'Extract Action Items' to get started"
                  : "No items match this filter"}
              </p>
            </div>
          )}
        </div>

        {/* Feature Description */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              ✨ How It Works
            </h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">🤖</span>
                <span>
                  <strong>AI Analyzes:</strong> Reads email for tasks,
                  deadlines, and requests
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">📝</span>
                <span>
                  <strong>Suggests:</strong> Proposes title, due date, priority,
                  and assignee
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">✓</span>
                <span>
                  <strong>You Confirm:</strong> Approve, edit, or reject
                  suggestions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">📊</span>
                <span>
                  <strong>Track:</strong> Monitor and manage confirmed action
                  items
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              🔍 AI Detection Basis
            </h3>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li>
                <strong>Request Verbs:</strong> "can you", "please", "need",
                "should"
              </li>
              <li>
                <strong>Urgency:</strong> "ASAP", "urgent", "critical", "today"
              </li>
              <li>
                <strong>Deadlines:</strong> "by Friday", "by EOD", dates
                mentioned
              </li>
              <li>
                <strong>Ownership:</strong> Names, "you", "we", "team"
              </li>
              <li>
                <strong>Action Words:</strong> send, prepare, review, approve,
                fix
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
