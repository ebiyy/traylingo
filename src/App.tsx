import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Check, Copy, Settings as SettingsIcon } from "lucide-solid";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { Settings } from "./components/Settings";
import type { TranslateError } from "./types/error";
import { parseError } from "./types/error";
import { formatText } from "./utils/formatText";

// Event payloads with session ID
interface ChunkPayload {
  session_id: string;
  text: string;
}

interface DonePayload {
  session_id: string;
}

interface UsagePayload {
  session_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost: number;
  cached?: boolean;
}

// Generate unique session ID
// WHY: Prevents interleaving when multiple translations overlap.
// Without this, rapid Cmd+J presses mix chunks from different API responses.
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface AppSettings {
  model: string;
}

function App() {
  const [original, setOriginal] = createSignal("");
  const [translated, setTranslated] = createSignal("");
  const [isTranslating, setIsTranslating] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [usage, setUsage] = createSignal<UsagePayload | null>(null);
  const [sessionCost, setSessionCost] = createSignal(0);
  const [currentSessionId, setCurrentSessionId] = createSignal("");
  const [error, setError] = createSignal<TranslateError | null>(null);
  const [view, setView] = createSignal<"main" | "settings">("main");
  const [currentModel, setCurrentModel] = createSignal("");

  // Debounce timer for auto-translate
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Formatted translation text
  const formattedTranslation = createMemo(() => formatText(translated()));

  // Copy translation to clipboard
  const copyTranslation = async () => {
    const text = translated();
    if (text) {
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Start translation
  const startTranslation = async (text: string) => {
    const sessionId = generateSessionId();
    setCurrentSessionId(sessionId);
    setTranslated("");
    setIsTranslating(true);
    setUsage(null);
    setError(null);

    try {
      await invoke("translate", { text, sessionId });
    } catch (err) {
      setError(parseError(err));
      setIsTranslating(false);
    }
  };

  // Retry translation
  const handleRetry = () => {
    const text = original();
    if (text) {
      startTranslation(text);
    }
  };

  // Trigger translation with debounce control
  const triggerTranslation = (text: string, immediate: boolean) => {
    // Clear any pending debounce
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (!text.trim()) return;

    if (immediate) {
      startTranslation(text);
    } else {
      debounceTimer = setTimeout(() => {
        startTranslation(text);
      }, 500);
    }
  };

  // Load current model from settings
  const loadSettings = async () => {
    try {
      const settings = await invoke<AppSettings>("get_settings");
      setCurrentModel(settings.model);
    } catch {
      // Settings may not exist yet, use default
    }
  };

  onMount(async () => {
    await loadSettings();

    // Listen for shortcut trigger
    await listen("shortcut-triggered", async () => {
      const text = await readText();
      if (text) {
        setOriginal(text);
        triggerTranslation(text, true);
      }
    });

    // Listen for translation chunks (filter by session ID)
    await listen<ChunkPayload>("translate-chunk", (event) => {
      if (event.payload.session_id === currentSessionId()) {
        setTranslated((prev) => prev + event.payload.text);
      }
    });

    // Listen for translation completion (filter by session ID)
    await listen<DonePayload>("translate-done", (event) => {
      if (event.payload.session_id === currentSessionId()) {
        setIsTranslating(false);
      }
    });

    // Listen for usage info (filter by session ID)
    await listen<UsagePayload>("translate-usage", (event) => {
      if (event.payload.session_id === currentSessionId()) {
        setUsage(event.payload);
        setSessionCost((prev) => prev + event.payload.estimated_cost);
      }
    });
  });

  return (
    <Show
      when={view() === "main"}
      fallback={
        <Settings
          onClose={() => {
            setView("main");
            loadSettings(); // Reload in case model changed
          }}
        />
      }
    >
      <div class="flex flex-col h-screen bg-gradient-subtle text-[var(--text-primary)]">
        {/* Main content */}
        <div class="flex flex-1 min-h-0">
          {/* Left pane - Original */}
          <div class="flex-1 flex flex-col border-r border-[var(--border-primary)]">
            <div class="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
              <h2 class="text-sm font-medium text-[var(--text-muted)]">Original</h2>
            </div>
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-4">
              <textarea
                class="w-full h-full bg-transparent text-base leading-relaxed resize-none outline-none placeholder:text-[var(--text-placeholder)] focus-ring"
                placeholder="Select text and press ⌘J, or paste/type here"
                value={original()}
                onInput={(e) => {
                  const text = e.currentTarget.value;
                  setOriginal(text);

                  // Paste: translate immediately, Typing: debounce 500ms
                  const inputType = (e as InputEvent).inputType;
                  const immediate = inputType === "insertFromPaste";
                  triggerTranslation(text, immediate);
                }}
              />
            </div>
          </div>

          {/* Right pane - Translation */}
          <div class="flex-1 flex flex-col">
            <div class="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
              <h2 class="text-sm font-medium text-[var(--accent-secondary)]">Translation</h2>
              <Show when={translated() && !isTranslating() && !error()}>
                <button
                  type="button"
                  onClick={copyTranslation}
                  class="p-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-theme"
                  title={copied() ? "Copied!" : "Copy to clipboard"}
                >
                  <Show when={copied()} fallback={<Copy size={14} />}>
                    <Check size={14} class="text-[var(--success)]" />
                  </Show>
                </button>
              </Show>
            </div>
            <div class="flex-1 overflow-y-auto overflow-x-hidden p-4">
              <Show
                when={!error()}
                fallback={
                  <ErrorDisplay
                    error={error() as TranslateError}
                    onRetry={handleRetry}
                    onOpenSettings={() => setView("settings")}
                    context={{ model: currentModel() }}
                  />
                }
              >
                <Show
                  when={isTranslating() && !translated()}
                  fallback={
                    <div
                      class={`text-base leading-relaxed whitespace-pre-wrap animate-fade-in ${isTranslating() ? "streaming-cursor" : ""}`}
                    >
                      {formattedTranslation() || (
                        <span class="text-[var(--text-placeholder)]">
                          Translation will appear here...
                        </span>
                      )}
                    </div>
                  }
                >
                  {/* Skeleton loading indicator */}
                  <div class="space-y-3">
                    <div class="h-4 rounded w-3/4 animate-skeleton" />
                    <div class="h-4 rounded w-full animate-skeleton" />
                    <div class="h-4 rounded w-5/6 animate-skeleton" />
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </div>

        {/* Footer - Usage stats */}
        <div class="flex items-center justify-between px-4 py-2 border-t border-[var(--border-primary)] text-xs text-[var(--text-muted)]">
          <div class="flex items-center gap-4">
            {/* Settings button */}
            <button
              type="button"
              onClick={() => setView("settings")}
              class="text-[var(--text-muted)] hover:text-[var(--accent-secondary)] transition-theme"
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>
            {/* TODO: Remove after Sentry verification */}
            <button
              type="button"
              onClick={() => {
                throw new Error("Sentry Frontend Error");
              }}
              class="text-red-500 hover:text-red-400 text-xs"
            >
              Test Sentry
            </button>
            <Show when={usage()}>
              <Show
                when={usage()?.cached}
                fallback={
                  <>
                    <span>
                      Tokens: {usage()?.prompt_tokens} in / {usage()?.completion_tokens} out
                    </span>
                    <span class="text-[var(--accent-primary)]">
                      ${usage()?.estimated_cost.toFixed(6)}
                    </span>
                  </>
                }
              >
                <span class="text-[var(--success)]">Cached</span>
                <span class="text-[var(--accent-primary)]">$0.00</span>
              </Show>
            </Show>
          </div>
          <Show when={sessionCost() > 0}>
            <span>
              Session:{" "}
              <span class="text-[var(--accent-secondary)]">${sessionCost().toFixed(6)}</span>
            </span>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export default App;
