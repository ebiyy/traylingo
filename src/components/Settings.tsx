import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-solid";
import { createEffect, createResource, createSignal, For, Show } from "solid-js";

interface SettingsData {
  api_key: string;
  model: string;
}

interface SettingsProps {
  onClose: () => void;
}

export function Settings(props: SettingsProps) {
  const [settings] = createResource<SettingsData>(() => invoke("get_settings"));
  const [models] = createResource<[string, string][]>(() => invoke("get_available_models"));

  const [apiKey, setApiKey] = createSignal("");
  const [model, setModel] = createSignal("claude-haiku-4-5-20251001");
  const [saving, setSaving] = createSignal(false);
  const [saved, setSaved] = createSignal(false);
  const [showKey, setShowKey] = createSignal(false);

  // Initialize form when settings load
  createEffect(() => {
    const s = settings();
    if (s) {
      setApiKey(s.api_key);
      setModel(s.model);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("save_settings", {
        newSettings: {
          api_key: apiKey(),
          model: model(),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // TODO: Replace with Logger.error when migrating to unified logging
      // biome-ignore lint/suspicious/noConsole: Legacy code, will migrate later
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="flex flex-col h-full bg-gradient-subtle text-[var(--text-primary)]">
      {/* Header */}
      <div class="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
        <h2 class="text-sm font-medium text-[var(--accent-secondary)]">Settings</h2>
        <button
          type="button"
          onClick={props.onClose}
          class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <Show
          when={!settings.loading}
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
            <div class="relative">
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
            <p class="mt-1 text-xs text-[var(--text-muted)]">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[var(--accent-secondary)] hover:underline"
              >
                Anthropic Console
              </a>
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
              onChange={(e) => setModel(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-theme text-sm"
            >
              <For each={models()}>{([id, name]) => <option value={id}>{name}</option>}</For>
            </select>
          </div>

          {/* Security Note */}
          <div class="p-3 bg-[var(--accent-secondary-muted)] rounded-md border border-[var(--border-primary)]">
            <p class="text-xs text-[var(--text-secondary)]">
              <span class="text-[var(--accent-secondary)]">Security:</span> Your API key is stored
              locally on your device and never sent anywhere except to Anthropic's API.
            </p>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-end gap-3 p-4 border-t border-[var(--border-primary)]">
        <button
          type="button"
          onClick={props.onClose}
          class="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-theme text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving()}
          class="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white rounded-md transition-theme text-sm"
        >
          {saving() ? "Saving..." : saved() ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}
