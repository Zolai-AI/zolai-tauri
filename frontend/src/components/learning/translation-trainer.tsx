/**
 * Translation trainer component.
 */

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TranslationResult {
  translation: string;
  confidence: number;
  sources: string[];
  note?: string;
}

export function TranslationTrainer() {
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState("auto");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);

  async function handleTranslate() {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await invoke<TranslationResult>("fetch_api_data", {
        endpoint: `/learning/translate?text=${encodeURIComponent(inputText)}&direction=${direction}`,
      });
      setResult(response);
    } catch (error) {
      console.error("Translation failed:", error);
      setResult({
        translation: "",
        confidence: 0,
        sources: [],
        note: "Translation failed",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCorrection() {
    if (!correction.trim() || !result) return;

    try {
      await invoke("post_api_data", {
        endpoint: "/learning/translate/correction",
        data: {
          original: inputText,
          ai_response: result.translation,
          corrected_response: correction,
          direction: direction,
        },
      });
      setCorrection("");
      setShowCorrection(false);
    } catch (error) {
      console.error("Failed to submit correction:", error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Translation</h3>

      {/* Input */}
      <div className="space-y-2">
        <textarea
          placeholder="Enter text to translate..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full p-2 border rounded resize-none"
        />

        <div className="flex space-x-2">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="auto">Auto-detect</option>
            <option value="zo-en">Zolai → English</option>
            <option value="en-zo">English → Zolai</option>
          </select>

          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 border rounded bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg">{result.translation}</p>
              {result.note && (
                <p className="mt-1 text-sm text-gray-500">{result.note}</p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`text-sm ${
                  result.confidence > 0.8
                    ? "text-green-500"
                    : result.confidence > 0.5
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          {result.sources.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Sources: {result.sources.join(", ")}
            </p>
          )}

          {/* Correction */}
          <div className="mt-3 pt-3 border-t">
            {!showCorrection ? (
              <button
                onClick={() => setShowCorrection(true)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Report correction
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Correct translation..."
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCorrection}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setShowCorrection(false);
                      setCorrection("");
                    }}
                    className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
