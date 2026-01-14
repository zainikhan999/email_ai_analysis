"use client";
import React, { useState } from "react";
import { MdEmail, MdLabel } from "react-icons/md";
import EmailSummarizer from "@/components/EmailSummarizer";
import EmailClassifier from "@/components/EmailClassifier";

export default function Home() {
  const [activeTab, setActiveTab] = useState("summarizer");

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Email Intelligence Suite
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("summarizer")}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === "summarizer"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              <MdEmail size={20} />
              Email Summarizer
            </button>
            <button
              onClick={() => setActiveTab("classifier")}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === "classifier"
                  ? "bg-green-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              <MdLabel size={20} />
              Inbox Intelligence
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="min-h-[calc(100vh-80px)]">
        {activeTab === "summarizer" && <EmailSummarizer />}
        {activeTab === "classifier" && <EmailClassifier />}
      </div>
    </div>
  );
}
