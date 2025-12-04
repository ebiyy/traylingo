import { invoke } from "@tauri-apps/api/core";
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
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div class="flex items-center justify-between p-3 border-b border-gray-800">
        <h2 class="text-sm font-medium text-[#E8A091]">Settings</h2>
        <button
          type="button"
          onClick={props.onClose}
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label="Close"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        <Show when={!settings.loading} fallback={<p class="text-gray-500">Loading...</p>}>
          {/* API Key */}
          <div class="mb-6">
            <label for="api-key" class="block text-sm font-medium text-gray-300 mb-2">
              Anthropic API Key
            </label>
            <div class="relative">
              <input
                id="api-key"
                type={showKey() ? "text" : "password"}
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder="sk-ant-..."
                class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B4557] text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey())}
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                {showKey() ? "Hide" : "Show"}
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#E8A091] hover:underline"
              >
                Anthropic Console
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div class="mb-6">
            <label for="model-select" class="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <select
              id="model-select"
              value={model()}
              onChange={(e) => setModel(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:border-[#8B4557] text-sm"
            >
              <For each={models()}>{([id, name]) => <option value={id}>{name}</option>}</For>
            </select>
          </div>

          {/* Security Note */}
          <div class="p-3 bg-gray-800/50 rounded-md border border-gray-700">
            <p class="text-xs text-gray-400">
              <span class="text-[#E8A091]">Security:</span> Your API key is stored locally on your
              device and never sent anywhere except to Anthropic's API.
            </p>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
        <button
          type="button"
          onClick={props.onClose}
          class="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving()}
          class="px-4 py-2 bg-[#8B4557] hover:bg-[#9B5567] disabled:opacity-50 text-white rounded-md transition-colors text-sm"
        >
          {saving() ? "Saving..." : saved() ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}
