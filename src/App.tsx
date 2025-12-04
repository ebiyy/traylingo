import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
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
}

// Generate unique session ID
// WHY: Prevents interleaving when multiple translations overlap.
// Without this, rapid Cmd+J presses mix chunks from different API responses.
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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

  onMount(async () => {
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
    <Show when={view() === "main"} fallback={<Settings onClose={() => setView("main")} />}>
      <div class="flex flex-col h-screen bg-gray-900 text-gray-100">
        {/* Main content */}
        <div class="flex flex-1 min-h-0">
          {/* Left pane - Original */}
          <div class="flex-1 flex flex-col border-r border-gray-700">
            <div class="flex items-center justify-between p-3 border-b border-gray-800">
              <h2 class="text-sm font-medium text-gray-400">Original</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
              <textarea
                class="w-full h-full bg-transparent text-base leading-relaxed resize-none outline-none placeholder:text-gray-500"
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
            <div class="flex items-center justify-between p-3 border-b border-gray-800">
              <h2 class="text-sm font-medium flex items-center gap-2">
                <span class="text-[#E8A091]">Translation</span>
                <Show when={isTranslating()}>
                  <span class="text-[#8B4557] animate-pulse">●</span>
                </Show>
              </h2>
              <Show when={translated() && !isTranslating() && !error()}>
                <button
                  type="button"
                  onClick={copyTranslation}
                  class="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  {copied() ? "Copied!" : "Copy"}
                </button>
              </Show>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
              <Show
                when={!error()}
                fallback={
                  <ErrorDisplay
                    error={error() as TranslateError}
                    onRetry={handleRetry}
                    onOpenSettings={() => setView("settings")}
                  />
                }
              >
                <div class="text-base leading-relaxed whitespace-pre-wrap">
                  {formattedTranslation() || (
                    <span class="text-gray-500">Translation will appear here...</span>
                  )}
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Footer - Usage stats */}
        <div class="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
          <div class="flex items-center gap-4">
            {/* Settings button */}
            <button
              type="button"
              onClick={() => setView("settings")}
              class="text-gray-400 hover:text-[#E8A091] transition-colors"
              title="Settings"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="Settings"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <Show when={usage()}>
              <span>
                Tokens: {usage()?.prompt_tokens} in / {usage()?.completion_tokens} out
              </span>
              <span class="text-[#8B4557]">${usage()?.estimated_cost.toFixed(6)}</span>
            </Show>
          </div>
          <Show when={sessionCost() > 0}>
            <span>
              Session: <span class="text-[#E8A091]">${sessionCost().toFixed(6)}</span>
            </span>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export default App;
