/**
 * Progress dashboard component.
 */

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface CEFRLevel {
  level: string;
  words_known: number;
  words_total: number;
  progress: number;
}

interface DueReview {
  vocab_word: string;
  ease_factor: number;
  interval: number;
  next_review: string;
}

export function ProgressDashboard() {
  const [cefr, setCefr] = useState<CEFRLevel | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const response = await invoke<{
        cefr: CEFRLevel;
        due_reviews: DueReview[];
      }>("fetch_api_data", {
        endpoint: "/learning/progress",
      });
      setCefr(response.cefr);
      setDueReviews(response.due_reviews);
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Learning Progress</h3>

      {/* CEFR Level */}
      {cefr && (
        <div className="p-4 border rounded bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Level</p>
              <p className="text-3xl font-bold text-blue-600">{cefr.level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Words Learned</p>
              <p className="text-2xl font-semibold">
                {cefr.words_known} / {cefr.words_total}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress to next level</span>
              <span>{Math.round(cefr.progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${cefr.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Level Milestones */}
          <div className="mt-4 grid grid-cols-6 gap-2 text-center text-xs">
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
              <div
                key={level}
                className={`p-1 rounded ${
                  cefr.level === level
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due Reviews */}
      <div>
        <h4 className="text-md font-semibold mb-3">
          Due for Review ({dueReviews.length})
        </h4>

        {dueReviews.length === 0 ? (
          <div className="p-4 text-center text-gray-500 border rounded">
            No words due for review. Great job!
          </div>
        ) : (
          <div className="space-y-2">
            {dueReviews.map((review, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <p className="font-medium">{review.vocab_word}</p>
                  <p className="text-xs text-gray-500">
                    Interval: {review.interval} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Next: {new Date(review.next_review).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Ease: {review.ease_factor.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded text-center">
          <p className="text-2xl font-bold text-green-500">
            {cefr?.words_known || 0}
          </p>
          <p className="text-sm text-gray-500">Words Mastered</p>
        </div>
        <div className="p-4 border rounded text-center">
          <p className="text-2xl font-bold text-orange-500">
            {dueReviews.length}
          </p>
          <p className="text-sm text-gray-500">Due Today</p>
        </div>
      </div>
    </div>
  );
}
