/**
 * Grammar editor component.
 */

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface GrammarPattern {
  id: number;
  pattern: string;
  pattern_type: string;
  description: string;
  example: string;
  zolai_example: string;
}

export function GrammarEditor() {
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [newPattern, setNewPattern] = useState({
    pattern: "",
    pattern_type: "sov",
    description: "",
    example: "",
    zolai_example: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, [searchQuery, filterType]);

  async function loadPatterns() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (filterType) params.append("pattern_type", filterType);

      const response = await invoke<{ patterns: GrammarPattern[] }>(
        "fetch_api_data",
        {
          endpoint: `/learning/grammar?${params.toString()}`,
        }
      );
      setPatterns(response.patterns);
    } catch (error) {
      console.error("Failed to load patterns:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    try {
      await invoke("post_api_data", {
        endpoint: "/learning/grammar",
        data: newPattern,
      });
      setNewPattern({
        pattern: "",
        pattern_type: "sov",
        description: "",
        example: "",
        zolai_example: "",
      });
      setShowAddForm(false);
      loadPatterns();
    } catch (error) {
      console.error("Failed to add pattern:", error);
    }
  }

  if (loading) {
    return <div className="p-4">Loading patterns...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Grammar Patterns</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          {showAddForm ? "Cancel" : "Add Pattern"}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Search patterns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Types</option>
          <option value="sov">SOV</option>
          <option value="negation">Negation</option>
          <option value="question">Question</option>
          <option value="tense">Tense</option>
        </select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 border rounded bg-gray-50 space-y-3">
          <input
            type="text"
            placeholder="Pattern (e.g., S + O + V)"
            value={newPattern.pattern}
            onChange={(e) =>
              setNewPattern({ ...newPattern, pattern: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <select
            value={newPattern.pattern_type}
            onChange={(e) =>
              setNewPattern({ ...newPattern, pattern_type: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="sov">SOV</option>
            <option value="negation">Negation</option>
            <option value="question">Question</option>
            <option value="tense">Tense</option>
          </select>
          <textarea
            placeholder="Description"
            value={newPattern.description}
            onChange={(e) =>
              setNewPattern({ ...newPattern, description: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="English example"
            value={newPattern.example}
            onChange={(e) =>
              setNewPattern({ ...newPattern, example: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Zolai example"
            value={newPattern.zolai_example}
            onChange={(e) =>
              setNewPattern({ ...newPattern, zolai_example: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Pattern
          </button>
        </div>
      )}

      {/* Patterns List */}
      <div className="space-y-2">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="p-3 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {pattern.pattern}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {pattern.pattern_type}
                </span>
              </div>
            </div>
            {pattern.description && (
              <p className="mt-2 text-sm text-gray-600">{pattern.description}</p>
            )}
            {pattern.example && (
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Example:</span> {pattern.example}
              </p>
            )}
            {pattern.zolai_example && (
              <p className="mt-1 text-sm">
                <span className="text-gray-500">Zolai:</span>{" "}
                {pattern.zolai_example}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
