/**
 * Dictionary manager component.
 */

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface DictionaryEntry {
  zolai: string;
  english: string;
  pos: string;
  source: string;
  direction: string;
}

export function DictionaryManager() {
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDirection, setSearchDirection] = useState("both");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    zolai: "",
    english: "",
    myanmar: "",
    pos: "",
  });

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await invoke<{ results: DictionaryEntry[] }>(
        "fetch_api_data",
        {
          endpoint: `/learning/dictionary?query=${encodeURIComponent(searchQuery)}&direction=${searchDirection}`,
        }
      );
      setResults(response.results);
    } catch (error) {
      console.error("Failed to search dictionary:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newEntry.zolai || !newEntry.english) return;

    try {
      await invoke("post_api_data", {
        endpoint: "/learning/dictionary",
        data: newEntry,
      });
      setNewEntry({ zolai: "", english: "", myanmar: "", pos: "" });
      setShowAddForm(false);
      // Refresh search
      if (searchQuery) {
        handleSearch();
      }
    } catch (error) {
      console.error("Failed to add entry:", error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dictionary</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          {showAddForm ? "Cancel" : "Add Entry"}
        </button>
      </div>

      {/* Search */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Search dictionary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 border rounded"
        />
        <select
          value={searchDirection}
          onChange={(e) => setSearchDirection(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="both">Both</option>
          <option value="zo-en">Zolai → English</option>
          <option value="en-zo">English → Zolai</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 border rounded bg-gray-50 space-y-3">
          <input
            type="text"
            placeholder="Zolai word"
            value={newEntry.zolai}
            onChange={(e) =>
              setNewEntry({ ...newEntry, zolai: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="English translation"
            value={newEntry.english}
            onChange={(e) =>
              setNewEntry({ ...newEntry, english: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Myanmar translation (optional)"
            value={newEntry.myanmar}
            onChange={(e) =>
              setNewEntry({ ...newEntry, myanmar: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Part of speech (optional)"
            value={newEntry.pos}
            onChange={(e) => setNewEntry({ ...newEntry, pos: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Entry
          </button>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((entry, index) => (
          <div key={index} className="p-3 border rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold">{entry.zolai}</span>
                <span className="mx-2">→</span>
                <span>{entry.english}</span>
              </div>
              <span className="text-xs text-gray-500">{entry.direction}</span>
            </div>
            {entry.pos && (
              <p className="mt-1 text-sm text-gray-500">POS: {entry.pos}</p>
            )}
            {entry.source && (
              <p className="mt-1 text-xs text-gray-400">
                Source: {entry.source}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
