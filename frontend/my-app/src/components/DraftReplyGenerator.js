"use client";
import React, { useState } from "react";
import {
  MdEdit,
  MdSend,
  MdRefresh,
  MdContentCopy,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

const SAMPLE_THREADS = [
  {
    id: 1,
    subject: "Project Timeline Discussion",
    sender: "manager@company.com",
    thread: `From: manager@company.com
Subject: Project Timeline Discussion
Date: Jan 14, 2026

Hi Team,

We need to discuss the updated project timeline for Q1. The client requested we move the launch date up by 2 weeks. Can you review the current schedule and provide your assessment by end of day?

Also, please let me know if there are any blockers or resource constraints we should be aware of.

Thanks,
Manager`,
  },
  {
    id: 2,
    subject: "Urgent: System Performance Issues",
    sender: "ops@company.com",
    thread: `From: ops@company.com
Subject: Urgent: System Performance Issues
Date: Jan 14, 2026

We're experiencing severe performance degradation on the production servers. Response times have increased from 200ms to 5+ seconds. This is impacting all users.

We've already:
- Restarted the application servers
- Cleared the cache
- Checked database connections

Still investigating. Please advise if you need any additional information. How long until we can get a full investigation completed?`,
  },
  {
    id: 3,
    subject: "Budget Approval for New Tools",
    sender: "finance@company.com",
    thread: `From: finance@company.com
Subject: Budget Approval for New Tools
Date: Jan 14, 2026

Hello,

We received your request for budget approval for the new development tools. Before we can proceed, we need:

1. Detailed cost-benefit analysis
2. Comparison with existing solutions
3. Timeline for ROI
4. Team size that will benefit

Could you provide these details so we can fast-track this through approval?

Best regards,
Finance Team`,
  },
];

const TONE_DESCRIPTIONS = {
  professional:
    "Formal, business-appropriate, action-oriented with clear next steps",
  friendly: "Warm, personable, yet professional - builds rapport",
  short: "Brief and concise - 2-3 sentences maximum, straight to the point",
  apologetic: "Empathetic, acknowledges issues, and provides clear resolution",
};

const TONE_COLORS = {
  professional: "bg-blue-100 text-blue-900 border border-blue-300",
  friendly: "bg-green-100 text-green-900 border border-green-300",
  short: "bg-yellow-100 text-yellow-900 border border-yellow-300",
  apologetic: "bg-red-100 text-red-900 border border-red-300",
};

export default function DraftReplyGenerator() {
  const [threads, setThreads] = useState(SAMPLE_THREADS);
  const [selectedThread, setSelectedThread] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const [refinementLoading, setRefinementLoading] = useState(false);
  const [apiUrl] = useState("http://127.0.0.1:8000");
  const [copiedDraft, setCopiedDraft] = useState(null);

  const generateDrafts = async () => {
    if (!selectedThread) {
      alert("Please select an email thread first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/draft-reply-all-tones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_subject: selectedThread.subject,
          original_sender: selectedThread.sender,
          thread_content: selectedThread.thread,
          context: "Professional software development company",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate drafts");
      const data = await response.json();

      setDrafts(data.drafts || []);
      setSelectedDraft(data.drafts[0] || null);
    } catch (err) {
      console.error("Error:", err);
      alert("Error generating drafts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refineDraft = async () => {
    if (!selectedDraft || !refinementFeedback.trim()) {
      alert("Please select a draft and provide refinement feedback");
      return;
    }

    setRefinementLoading(true);
    try {
      const response = await fetch(`${apiUrl}/refine-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_draft: selectedDraft.body,
          feedback: refinementFeedback,
          tone: selectedDraft.tone,
        }),
      });

      if (!response.ok) throw new Error("Failed to refine draft");
      const data = await response.json();

      // Update the selected draft with refined version
      setSelectedDraft({
        ...selectedDraft,
        body: data.body,
        preview: data.preview,
      });
      setRefinementFeedback("");
    } catch (err) {
      console.error("Error:", err);
      alert("Error refining draft: " + err.message);
    } finally {
      setRefinementLoading(false);
    }
  };

  const copyToClipboard = (text, draftTone) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(draftTone);
    setTimeout(() => setCopiedDraft(null), 2000);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8"
      suppressHydrationWarning
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <MdEdit className="text-purple-600" size={40} />
            AI Draft Replies
          </h2>
          <p className="text-slate-600">
            Generate professional email drafts in multiple tones. AI suggests,
            you confirm before sending.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Thread Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h3 className="font-semibold text-slate-900 mb-4">
                Email Threads
              </h3>
              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setSelectedThread(thread);
                      setDrafts([]);
                      setSelectedDraft(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedThread?.id === thread.id
                        ? "bg-purple-600 text-white"
                        : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <p className="font-medium truncate">{thread.subject}</p>
                    <p className="text-xs opacity-75 truncate">
                      {thread.sender}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={generateDrafts}
                disabled={!selectedThread || loading}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <MdRefresh size={20} />
                    Generate Drafts
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Middle Panel: Draft Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Tone Variants
              </h3>
              <div className="space-y-2">
                {drafts.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Select a thread and click "Generate Drafts" to get started
                  </p>
                ) : (
                  drafts.map((draft, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDraft(draft);
                        setExpandedDraft(draft.tone); // Auto-expand draft preview
                      }}
                      className={`w-full text-left p-3 rounded-lg transition border-2 ${
                        selectedDraft?.tone === draft.tone
                          ? `border-purple-600 bg-purple-50`
                          : `border-slate-200 bg-slate-50 hover:border-slate-300`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {selectedDraft?.tone === draft.tone ? (
                          <MdCheckCircle
                            className="text-purple-600"
                            size={18}
                          />
                        ) : (
                          <MdRadioButtonUnchecked
                            className="text-slate-400"
                            size={18}
                          />
                        )}
                        <p className="font-medium capitalize">{draft.tone}</p>
                      </div>
                      <p className="text-xs text-slate-600">
                        {TONE_DESCRIPTIONS[draft.tone]}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Draft Content */}
          <div className="lg:col-span-1">
            {selectedDraft ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Subject Line
                  </h4>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-slate-900">
                    {selectedDraft.subject}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Tone</h4>
                  <div
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      TONE_COLORS[selectedDraft.tone]
                    }`}
                  >
                    {selectedDraft.tone.charAt(0).toUpperCase() +
                      selectedDraft.tone.slice(1)}
                  </div>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(selectedDraft.body, selectedDraft.tone)
                  }
                  className={`w-full px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    copiedDraft === selectedDraft.tone
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  <MdContentCopy size={18} />
                  {copiedDraft === selectedDraft.tone
                    ? "Copied!"
                    : "Copy Draft"}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <MdEdit size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">No draft selected</p>
                <p className="text-slate-500 text-sm">
                  Generate drafts to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Draft Preview and Refinement */}
        {selectedDraft && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <button
                onClick={() =>
                  setExpandedDraft(
                    expandedDraft === selectedDraft.tone
                      ? null
                      : selectedDraft.tone
                  )
                }
                className="flex items-center gap-2 w-full font-semibold text-slate-900 hover:text-slate-700"
              >
                {expandedDraft === selectedDraft.tone ? (
                  <MdExpandLess size={20} />
                ) : (
                  <MdExpandMore size={20} />
                )}
                Draft Preview
              </button>
            </div>

            {expandedDraft === selectedDraft.tone && (
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-h-96 overflow-y-auto whitespace-pre-wrap text-slate-900">
                {selectedDraft.body}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">
                Refine This Draft
              </h4>
              <textarea
                value={refinementFeedback}
                onChange={(e) => setRefinementFeedback(e.target.value)}
                placeholder="e.g., 'Make it more technical' or 'Add a mention of budget' or 'Soften the tone'"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="2"
              />
              <button
                onClick={refineDraft}
                disabled={!refinementFeedback.trim() || refinementLoading}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {refinementLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Refining...
                  </>
                ) : (
                  <>
                    <MdRefresh size={18} />
                    Refine Draft
                  </>
                )}
              </button>
            </div>

            <div className="border-t pt-4 flex gap-3">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                <MdCheckCircle size={20} />
                Use This Draft
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
                <MdSend size={20} />
                Send Email
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        {drafts.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="font-semibold text-purple-900 mb-2">
              💡 How to Use
            </h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>
                ✓ AI generates draft replies in 4 different tones for comparison
              </li>
              <li>✓ Select the tone that best fits your response</li>
              <li>
                ✓ Use "Refine Draft" to adjust the message based on your
                feedback
              </li>
              <li>
                ✓ Copy or send the final draft directly from this interface
              </li>
              <li>
                ✓ Remember: AI never sends automatically - you always confirm
                first
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
