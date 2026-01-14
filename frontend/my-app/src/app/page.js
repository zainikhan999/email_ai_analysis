"use client";
import React, { useState } from "react";
import { MdEmail, MdLabel, MdChecklistRtl, MdEdit } from "react-icons/md";
import EmailSummarizer from "@/components/EmailSummarizer";
import EmailClassifier from "@/components/EmailClassifier";
import ActionItemExtractor from "@/components/ActionItemExtractor";
import DraftReplyGenerator from "@/components/DraftReplyGenerator";

export default function Home() {
  const [activeTab, setActiveTab] = useState("summarizer");

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Email Intelligence Suite
          </h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("summarizer")}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === "summarizer"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              <MdEmail size={20} />
              Summarizer
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
              Classifier
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === "actions"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              <MdChecklistRtl size={20} />
              Actions
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === "drafts"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-900 hover:bg-slate-300"
              }`}
            >
              <MdEdit size={20} />
              Drafts
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="min-h-[calc(100vh-80px)]">
        {activeTab === "summarizer" && <EmailSummarizer />}
        {activeTab === "classifier" && <EmailClassifier />}
        {activeTab === "actions" && <ActionItemExtractor />}
        {activeTab === "drafts" && <DraftReplyGenerator />}
      </div>
    </div>
  );
}
