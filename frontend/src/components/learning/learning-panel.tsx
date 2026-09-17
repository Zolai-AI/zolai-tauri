/**
 * Main learning panel component.
 */

import React, { useState } from "react";
import { GrammarEditor } from "./grammar-editor";
import { DictionaryManager } from "./dictionary-manager";
import { TranslationTrainer } from "./translation-trainer";
import { ProgressDashboard } from "./progress-dashboard";

type Tab = "grammar" | "dictionary" | "translation" | "progress";

export function LearningPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("dictionary");

  const tabs: { id: Tab; label: string }[] = [
    { id: "dictionary", label: "Dictionary" },
    { id: "grammar", label: "Grammar" },
    { id: "translation", label: "Translation" },
    { id: "progress", label: "Progress" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "grammar" && <GrammarEditor />}
        {activeTab === "dictionary" && <DictionaryManager />}
        {activeTab === "translation" && <TranslationTrainer />}
        {activeTab === "progress" && <ProgressDashboard />}
      </div>
    </div>
  );
}
