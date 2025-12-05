import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-solid";
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import { setTelemetryEnabled } from "../index";
import { Logger } from "../utils/logger";

interface SettingsData {
  api_key: string;
  model: string;
  send_telemetry?: boolean;
}

interface SettingsProps {
  onClose: () => void;
}

export function Settings(props: SettingsProps) {
  const [settings, { refetch }] = createResource<SettingsData>(() => invoke("get_settings"));
  const [models] = createResource<[string, string][]>(() => invoke("get_available_models"));

  const [apiKey, setApiKey] = createSignal("");
  const [model, setModel] = createSignal("claude-haiku-4-5-20251001");
  const [sendTelemetry, setSendTelemetry] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [saved, setSaved] = createSignal(false);
  const [showKey, setShowKey] = createSignal(false);

  // Track if there are unsaved changes
  const hasChanges = createMemo(() => {
    const s = settings();
    if (!s) return false;
    return (
      apiKey() !== s.api_key ||
      model() !== s.model ||
      sendTelemetry() !== (s.send_telemetry ?? true)
    );
  });

  // Initialize form when settings load
  createEffect(() => {
    const s = settings();
    if (s) {
      setApiKey(s.api_key);
      setModel(s.model);
      setSendTelemetry(s.send_telemetry ?? true);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("save_settings", {
        newSettings: {
          api_key: apiKey(),
          model: model(),
          send_telemetry: sendTelemetry(),
        },
      });
      // Update frontend telemetry flag immediately
      setTelemetryEnabled(sendTelemetry());
      // Refetch settings to update hasChanges comparison
      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Logger.error("ipc", "Failed to save settings", { error: String(err) });
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

          {/* Error Reporting */}
          <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendTelemetry()}
                onChange={(e) => setSendTelemetry(e.currentTarget.checked)}
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
              <a
                href="https://github.com/ebiyy/traylingo/blob/main/PRIVACY.md"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[var(--accent-secondary)] hover:underline"
              >
                Privacy Policy
              </a>
            </p>
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
      <div class="flex items-center justify-between p-4 border-t border-[var(--border-primary)]">
        <Show when={hasChanges() && !saved()}>
          <span class="text-xs text-[var(--accent-warning)]">Unsaved changes</span>
        </Show>
        <Show when={!hasChanges() || saved()}>
          <span />
        </Show>
        <div class="flex items-center gap-3">
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
            class={`px-4 py-2 rounded-md transition-theme text-sm ${
              hasChanges() && !saving()
                ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white animate-pulse"
                : "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white"
            }`}
          >
            {saving() ? "Saving..." : saved() ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
