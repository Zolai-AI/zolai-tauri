/**
 * Settings form component for Zolai desktop app.
 */

import React, { useState, useEffect } from "react";
import { fetchSettings, updateSettings, AppSettings } from "../../lib/settings";
import { fetchProviders, Provider } from "../../lib/providers";

interface SettingsFormProps {
  onSettingsSaved?: () => void;
}

export function SettingsForm({ onSettingsSaved }: SettingsFormProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [settingsData, providersData] = await Promise.all([
        fetchSettings(),
        fetchProviders(),
      ]);
      setSettings(settingsData);
      setProviders(providersData);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setMessage("");

    try {
      const success = await updateSettings(settings);
      if (success) {
        setMessage("Settings saved successfully!");
        onSettingsSaved?.();
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(key: keyof AppSettings, value: any) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-4">Failed to load settings</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Provider Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Provider</h3>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => handleChange("provider", e.target.value)}
            className="w-full p-2 border rounded"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name} disabled={!p.available}>
                {p.name} {!p.available && "(unavailable)"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Model</label>
          <select
            value={settings.model}
            onChange={(e) => handleChange("model", e.target.value)}
            className="w-full p-2 border rounded"
          >
            {providers
              .find((p) => p.name === settings.provider)
              ?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="offline_mode"
            checked={settings.offline_mode}
            onChange={(e) => handleChange("offline_mode", e.target.checked)}
          />
          <label htmlFor="offline_mode" className="text-sm">
            Offline Mode (use rule-based fallback)
          </label>
        </div>
      </section>

      {/* Learning Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Learning</h3>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="spaced_repetition"
            checked={settings.spaced_repetition_enabled}
            onChange={(e) =>
              handleChange("spaced_repetition_enabled", e.target.checked)
            }
          />
          <label htmlFor="spaced_repetition" className="text-sm">
            Enable Spaced Repetition
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Daily Goal (words)
          </label>
          <input
            type="number"
            value={settings.daily_goal_words}
            onChange={(e) =>
              handleChange("daily_goal_words", parseInt(e.target.value) || 10)
            }
            min={1}
            max={100}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="auto_zvs"
            checked={settings.auto_zvs_correction}
            onChange={(e) =>
              handleChange("auto_zvs_correction", e.target.checked)
            }
          />
          <label htmlFor="auto_zvs" className="text-sm">
            Auto ZVS 2018 Correction
          </label>
        </div>
      </section>

      {/* UI Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Interface</h3>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleChange("theme", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="en">English</option>
            <option value="zo">Zolai</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="audio"
            checked={settings.audio_enabled}
            onChange={(e) => handleChange("audio_enabled", e.target.checked)}
          />
          <label htmlFor="audio" className="text-sm">
            Enable Audio
          </label>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && (
          <span
            className={`text-sm ${
              message.includes("success") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
