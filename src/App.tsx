import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { createMemo, createSignal, onMount, Show } from "solid-js";

// Token usage info from backend
interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost: number;
}

// Format text based on detected language, preserving code blocks
function formatText(text: string): string {
  if (!text) return text;

  // Split by code blocks to preserve them
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part) => {
      // Don't modify code blocks
      if (part.startsWith("```")) {
        return part;
      }

      // Detect if Japanese (hiragana, katakana, or kanji)
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(part);

      if (isJapanese) {
        // Add line breaks after Japanese periods for readability
        return part.replace(/。(?![\n」』）])/g, "。\n").replace(/\n{3,}/g, "\n\n");
      }

      // English: preserve existing formatting
      return part;
    })
    .join("");
}

function App() {
  const [original, setOriginal] = createSignal("");
  const [translated, setTranslated] = createSignal("");
  const [isTranslating, setIsTranslating] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [usage, setUsage] = createSignal<UsageInfo | null>(null);
  const [sessionCost, setSessionCost] = createSignal(0);

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

  onMount(async () => {
    // Listen for shortcut trigger
    await listen("shortcut-triggered", async () => {
      const text = await readText();
      if (text) {
        setOriginal(text);
        setTranslated("");
        setIsTranslating(true);
        setUsage(null);
        invoke("translate", { text }).catch((err) => {
          setTranslated(`Error: ${err}`);
          setIsTranslating(false);
        });
      }
    });

    // Listen for translation chunks
    await listen<string>("translate-chunk", (event) => {
      setTranslated((prev) => prev + event.payload);
    });

    // Listen for translation completion
    await listen("translate-done", () => {
      setIsTranslating(false);
    });

    // Listen for usage info
    await listen<UsageInfo>("translate-usage", (event) => {
      setUsage(event.payload);
      setSessionCost((prev) => prev + event.payload.estimated_cost);
    });
  });

  return (
    <div class="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Main content */}
      <div class="flex flex-1 min-h-0">
        {/* Left pane - Original */}
        <div class="flex-1 flex flex-col border-r border-gray-700">
          <div class="flex items-center justify-between p-3 border-b border-gray-800">
            <h2 class="text-sm font-medium text-gray-400">Original</h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="text-base leading-relaxed whitespace-pre-wrap">
              {original() || <span class="text-gray-500">Select text and press ⌘J</span>}
            </div>
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
            <Show when={translated() && !isTranslating()}>
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
            <div class="text-base leading-relaxed whitespace-pre-wrap">
              {formattedTranslation() || (
                <span class="text-gray-500">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Usage stats */}
      <div class="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
        <div class="flex items-center gap-4">
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
  );
}

export default App;
