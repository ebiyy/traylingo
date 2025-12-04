import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Check, Copy, X } from "lucide-solid";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import type { TranslateError } from "../types/error";
import { getUserMessage, parseError } from "../types/error";
import { formatText } from "../utils/formatText";

const MIN_HEIGHT = 80; // 2 lines + header
const MAX_HEIGHT = 400;
const HEADER_HEIGHT = 32; // Header with icons
const AUTO_CLOSE_DELAY = 8000; // 8 seconds

export function PopupView() {
  const [text, setText] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<TranslateError | null>(null);
  const [copied, setCopied] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;
  let autoCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let unlistenPopupShown: UnlistenFn | undefined;
  // TECH_DEBT: Debounce to prevent double-trigger from popup-shown + onFocusChanged
  // WHY: Both events fire when popup is shown, causing race condition
  // RISK: 500ms may block legitimate rapid consecutive translations
  // IMPROVEMENT: Use single trigger (event OR focus, not both) to eliminate need for debounce
  // SEE: TODO.md "Technical Debt" section
  let lastTranslationTime = 0;
  const DEBOUNCE_MS = 500;

  const closePopup = async () => {
    await invoke("close_popup");
  };

  const copyText = async () => {
    const translated = text();
    if (translated) {
      await writeText(translated);
      setCopied(true);
      // Reset copied state after 1.5s
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const resetAutoCloseTimer = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    autoCloseTimer = setTimeout(() => {
      closePopup();
    }, AUTO_CLOSE_DELAY);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closePopup();
    }
  };

  const runTranslation = async () => {
    // Debounce: skip if called too quickly (prevents double-trigger from event + focus)
    const now = Date.now();
    if (now - lastTranslationTime < DEBOUNCE_MS) {
      return;
    }
    lastTranslationTime = now;

    setText("");
    setError(null);
    setIsLoading(true);

    try {
      let clipboardText: string | null = null;
      try {
        clipboardText = await readText();
      } catch {
        // Clipboard read failed - might be empty or non-text content
        setError(
          parseError(
            "クリップボードにテキストがありません。テキストを選択してから再度お試しください。",
          ),
        );
        setIsLoading(false);
        return;
      }

      if (clipboardText) {
        const result = await invoke<string>("quick_translate", {
          text: clipboardText,
        });
        setText(result);
      } else {
        setError(
          parseError(
            "クリップボードにテキストがありません。テキストを選択してから再度お試しください。",
          ),
        );
      }
    } catch (e) {
      setError(parseError(e));
    } finally {
      setIsLoading(false);
    }
  };

  // Resize window based on content
  const resizeToContent = async () => {
    if (!contentRef) return;
    const currentWindow = getCurrentWindow();
    const contentHeight = contentRef.scrollHeight + HEADER_HEIGHT;
    const newHeight = Math.min(Math.max(contentHeight, MIN_HEIGHT), MAX_HEIGHT);
    await currentWindow.setSize(
      new PhysicalSize(400, Math.round(newHeight * window.devicePixelRatio)),
    );
  };

  // Resize when content changes and start auto-close timer
  createEffect(() => {
    // Track reactive dependencies
    const currentText = text();
    const currentError = error();
    const loading = isLoading();
    // Resize after DOM update
    setTimeout(resizeToContent, 10);
    // Start auto-close timer when translation completes
    if (!loading && (currentText || currentError)) {
      resetAutoCloseTimer();
    }
  });

  onMount(async () => {
    document.addEventListener("keydown", handleKeyDown);

    // TECH_DEBT: Dual trigger system - both may fire simultaneously
    // Primary: popup-shown event from Rust (emitted in show_popup)
    // Backup: onFocusChanged (fires when window gains focus)
    // WHY: Needed because focus events alone were unreliable after window hide/show cycle
    // RISK: Both fire together → debounce needed above
    // IMPROVEMENT: Use only one reliable trigger mechanism
    unlistenPopupShown = await listen("popup-shown", () => {
      runTranslation();
    });

    const currentWindow = getCurrentWindow();
    await currentWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        runTranslation();
      }
    });
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    if (unlistenPopupShown) {
      unlistenPopupShown();
    }
  });

  return (
    <div class="bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Header with icons */}
      <div class="flex items-center justify-end gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
        <button
          type="button"
          onClick={copyText}
          disabled={isLoading() || !!error()}
          class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Copy"
        >
          <Show when={copied()} fallback={<Copy size={14} />}>
            <Check size={14} class="text-green-400" />
          </Show>
        </button>
        <button
          type="button"
          onClick={closePopup}
          class="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        class="p-4 overflow-y-auto"
        style={{ "max-height": `${MAX_HEIGHT - HEADER_HEIGHT}px` }}
      >
        <Show
          when={!isLoading()}
          fallback={
            <div class="space-y-2 animate-pulse">
              <div class="h-3 bg-gray-700 rounded w-3/4" />
              <div class="h-3 bg-gray-700 rounded w-full" />
              <div class="h-3 bg-gray-700 rounded w-5/6" />
            </div>
          }
        >
          <Show
            when={!error()}
            fallback={<p class="text-red-400">{getUserMessage(error() as TranslateError)}</p>}
          >
            <p class="leading-relaxed whitespace-pre-wrap wrap-break-word">{formatText(text())}</p>
          </Show>
        </Show>
      </div>
    </div>
  );
}
