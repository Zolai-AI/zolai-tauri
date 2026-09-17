/**
 * Settings management for Zolai desktop app.
 */

import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  provider: string;
  model: string;
  language: string;
  theme: string;
  auto_zvs_correction: boolean;
  spaced_repetition_enabled: boolean;
  daily_goal_words: number;
  audio_enabled: boolean;
  offline_mode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  provider: "ollama",
  model: "qwen3-coder:480b-cloud",
  language: "en",
  theme: "dark",
  auto_zvs_correction: true,
  spaced_repetition_enabled: true,
  daily_goal_words: 10,
  audio_enabled: false,
  offline_mode: false,
};

/**
 * Fetch all settings from the API.
 */
export async function fetchSettings(): Promise<AppSettings> {
  try {
    const response = await invoke<AppSettings>("fetch_api_data", {
      endpoint: "/settings",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update settings.
 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<boolean> {
  try {
    await invoke("post_api_data", {
      endpoint: "/settings",
      data: settings,
    });
    return true;
  } catch (error) {
    console.error("Failed to update settings:", error);
    return false;
  }
}

/**
 * Get provider-specific settings.
 */
export async function getProviderSettings(): Promise<{
  provider: string;
  model: string;
  offline_mode: boolean;
}> {
  try {
    return await invoke("fetch_api_data", {
      endpoint: "/settings/provider",
    });
  } catch (error) {
    console.error("Failed to get provider settings:", error);
    return {
      provider: "ollama",
      model: "qwen3-coder:480b-cloud",
      offline_mode: false,
    };
  }
}

/**
 * Get learning-specific settings.
 */
export async function getLearningSettings(): Promise<{
  spaced_repetition_enabled: boolean;
  daily_goal_words: number;
  auto_zvs_correction: boolean;
}> {
  try {
    return await invoke("fetch_api_data", {
      endpoint: "/settings/learning",
    });
  } catch (error) {
    console.error("Failed to get learning settings:", error);
    return {
      spaced_repetition_enabled: true,
      daily_goal_words: 10,
      auto_zvs_correction: true,
    };
  }
}

/**
 * Get UI-specific settings.
 */
export async function getUISettings(): Promise<{
  language: string;
  theme: string;
  audio_enabled: boolean;
}> {
  try {
    const settings = await fetchSettings();
    return {
      language: settings.language,
      theme: settings.theme,
      audio_enabled: settings.audio_enabled,
    };
  } catch (error) {
    console.error("Failed to get UI settings:", error);
    return {
      language: "en",
      theme: "dark",
      audio_enabled: false,
    };
  }
}
