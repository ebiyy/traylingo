import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-solid";
import { createEffect, createResource, createSignal, For, Show } from "solid-js";
import { setTelemetryEnabled } from "../index";
import { Logger } from "../utils/logger";

interface SettingsData {
  // NOTE: api_key is stored in macOS Keychain, fetched separately via get_api_key
  model: string;
  send_telemetry?: boolean;
  cache_enabled?: boolean;
}

interface SettingsProps {
  onClose: () => void;
}

export function Settings(props: SettingsProps) {
  const [settings, { refetch }] = createResource<SettingsData>(() => invoke("get_settings"));
  const [models] = createResource<[string, string][]>(() => invoke("get_available_models"));
  // API key is stored in macOS Keychain, fetched separately
  const [storedApiKey, { refetch: refetchApiKey }] = createResource<string | null>(() =>
    invoke("get_api_key"),
  );

  const [apiKey, setApiKey] = createSignal("");
  const [model, setModel] = createSignal("claude-haiku-4-5-20251001");
  const [sendTelemetry, setSendTelemetry] = createSignal(true);
  const [cacheEnabled, setCacheEnabled] = createSignal(true);
  const [showKey, setShowKey] = createSignal(false);
  const [clearingCache, setClearingCache] = createSignal(false);
  const [cacheCleared, setCacheCleared] = createSignal(false);
  const [saved, setSaved] = createSignal(false);
  const [savingApiKey, setSavingApiKey] = createSignal(false);
  const [apiKeySaved, setApiKeySaved] = createSignal(false);

  // Initialize form when settings load
  createEffect(() => {
    const s = settings();
    if (s) {
      setModel(s.model);
      setSendTelemetry(s.send_telemetry ?? true);
      setCacheEnabled(s.cache_enabled ?? true);
    }
  });

  // Initialize API key from Keychain
  createEffect(() => {
    const key = storedApiKey();
    if (key !== undefined) {
      setApiKey(key ?? "");
    }
  });

  const openExternalUrl = (url: string) => {
    invoke("open_external_url", { url }).catch((err) => {
      Logger.error("ipc", "Failed to open external URL", { error: String(err), url });
    });
  };

  // Save API key to Keychain (explicit save)
  const handleSaveApiKey = async () => {
    setSavingApiKey(true);
    try {
      await invoke("set_api_key", { key: apiKey() });
      await refetchApiKey();
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    } catch (err) {
      Logger.error("ipc", "Failed to save API key", { error: String(err) });
    } finally {
      setSavingApiKey(false);
    }
  };

  // Auto-save settings (model, cache, telemetry)
  const handleAutoSave = async (newSettings: Partial<SettingsData>) => {
    try {
      const currentSettings = settings();
      if (!currentSettings) return;

      const mergedSettings = {
        model: newSettings.model ?? model(),
        send_telemetry: newSettings.send_telemetry ?? sendTelemetry(),
        cache_enabled: newSettings.cache_enabled ?? cacheEnabled(),
      };

      await invoke("save_settings", { newSettings: mergedSettings });

      // Update frontend telemetry flag if changed
      if (newSettings.send_telemetry !== undefined) {
        setTelemetryEnabled(newSettings.send_telemetry);
      }

      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Logger.error("ipc", "Failed to save settings", { error: String(err) });
    }
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    handleAutoSave({ model: newModel });
  };

  const handleCacheEnabledChange = (enabled: boolean) => {
    setCacheEnabled(enabled);
    handleAutoSave({ cache_enabled: enabled });
  };

  const handleTelemetryChange = (enabled: boolean) => {
    setSendTelemetry(enabled);
    handleAutoSave({ send_telemetry: enabled });
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await invoke("clear_translation_cache");
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
      Logger.info("ui", "Translation cache cleared");
    } catch (err) {
      Logger.error("ipc", "Failed to clear cache", { error: String(err) });
    } finally {
      setClearingCache(false);
    }
  };

  // Check if API key has unsaved changes
  const apiKeyChanged = () => {
    const currentStoredKey = storedApiKey() ?? "";
    return apiKey() !== currentStoredKey;
  };

  return (
    <div class="flex flex-col h-full bg-gradient-subtle text-[var(--text-primary)]">
      {/* Header */}
      <div class="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <h2 class="text-sm font-medium text-[var(--accent-secondary)]">Settings</h2>
        <div class="flex items-center gap-3">
          <Show when={saved()}>
            <span class="text-xs text-[var(--accent-success)]">Saved ✓</span>
          </Show>
          <button
            type="button"
            onClick={props.onClose}
            class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <Show
          when={!settings.loading && !storedApiKey.loading}
          fallback={<p class="text-[var(--text-muted)]">Loading...</p>}
        >
          {/* API Key */}
          <div class="mb-6">
            <label
              for="api-key"
              class="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Anthropic API Key
            </label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  id="api-key"
                  type={showKey() ? "text" : "password"}
                  value={apiKey()}
                  onInput={(e) => setApiKey(e.currentTarget.value)}
                  placeholder="sk-ant-..."
                  class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--accent-primary)] transition-theme text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey())}
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme text-xs"
                >
                  {showKey() ? "Hide" : "Show"}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={savingApiKey() || !apiKeyChanged()}
                class={`px-3 py-2 rounded-md text-sm transition-theme whitespace-nowrap ${
                  apiKeyChanged() && !savingApiKey()
                    ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
              >
                {savingApiKey() ? "..." : apiKeySaved() ? "Saved" : "Save"}
              </button>
            </div>
            <p class="mt-1 text-xs text-[var(--text-muted)]">
              Get your API key from{" "}
              <button
                type="button"
                onClick={() => openExternalUrl("https://console.anthropic.com/settings/keys")}
                class="text-[var(--accent-secondary)] hover:underline"
              >
                Anthropic Console
              </button>
            </p>
          </div>

          {/* Model Selection */}
          <div class="mb-6">
            <label
              for="model-select"
              class="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Model
            </label>
            <select
              id="model-select"
              value={model()}
              onChange={(e) => handleModelChange(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-theme text-sm"
            >
              <For each={models()}>{([id, name]) => <option value={id}>{name}</option>}</For>
            </select>
          </div>

          {/* Cache Settings */}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">Translation Cache</h3>
            <label class="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={cacheEnabled()}
                onChange={(e) => handleCacheEnabledChange(e.currentTarget.checked)}
                class="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-offset-0"
              />
              <span class="text-sm text-[var(--text-secondary)]">
                Save translation cache locally
              </span>
            </label>
            <p class="text-xs text-[var(--text-muted)] ml-7 mb-3">
              Caches translations to avoid repeated API calls. Disable for privacy.
              <br />
              Cache entries expire after 30 days.
            </p>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={clearingCache()}
              class="ml-7 px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-tertiary)] transition-theme disabled:opacity-50"
            >
              {clearingCache() ? "Clearing..." : cacheCleared() ? "Cleared!" : "Clear all cache"}
            </button>
          </div>

          {/* Error Reporting */}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-[var(--text-secondary)] mb-3">Privacy</h3>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendTelemetry()}
                onChange={(e) => handleTelemetryChange(e.currentTarget.checked)}
                class="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] focus:ring-offset-0"
              />
              <span class="text-sm text-[var(--text-secondary)]">
                Send error reports to help improve the app
              </span>
            </label>
            <p class="mt-2 text-xs text-[var(--text-muted)] ml-7">
              Error reports help us fix bugs. No translation content is sent.
              <br />
              Changes take effect after restarting the app.{" "}
              <button
                type="button"
                onClick={() =>
                  openExternalUrl("https://github.com/ebiyy/traylingo/blob/main/PRIVACY.md")
                }
                class="text-[var(--accent-secondary)] hover:underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>

          {/* Security Note */}
          <div class="p-3 bg-[var(--accent-secondary-muted)] rounded-md border border-[var(--border-primary)]">
            <p class="text-xs text-[var(--text-secondary)]">
              <span class="text-[var(--accent-secondary)]">Security:</span> Your API key is securely
              stored in macOS Keychain and never sent anywhere except to Anthropic's API.
              Translation cache is stored locally and can be cleared anytime.
            </p>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-end p-4 border-t border-[var(--border-primary)]">
        <button
          type="button"
          onClick={props.onClose}
          class="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-theme text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
