/**
 * Provider selection logic for Zolai desktop app.
 */

import { invoke } from "@tauri-apps/api/core";

export interface Provider {
  name: string;
  priority: number;
  available: boolean;
  models: string[];
  description: string;
}

export interface ProviderSettings {
  provider: string;
  model: string;
  offline_mode: boolean;
}

/**
 * Fetch available providers from the API.
 */
export async function fetchProviders(): Promise<Provider[]> {
  try {
    const response = await invoke<{ providers: Provider[] }>("fetch_api_data", {
      endpoint: "/providers",
    });
    return response.providers;
  } catch (error) {
    console.error("Failed to fetch providers:", error);
    return [];
  }
}

/**
 * Get the currently selected provider.
 */
export async function getSelectedProvider(): Promise<ProviderSettings> {
  try {
    const response = await invoke<ProviderSettings>("fetch_api_data", {
      endpoint: "/settings/provider",
    });
    return response;
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
 * Update provider selection.
 */
export async function updateProvider(settings: Partial<ProviderSettings>): Promise<boolean> {
  try {
    await invoke("post_api_data", {
      endpoint: "/settings",
      data: settings,
    });
    return true;
  } catch (error) {
    console.error("Failed to update provider:", error);
    return false;
  }
}

/**
 * Get available models for a provider.
 */
export function getModelsForProvider(provider: Provider): string[] {
  return provider.models;
}

/**
 * Check if provider is available.
 */
export function isProviderAvailable(provider: Provider): boolean {
  return provider.available;
}
