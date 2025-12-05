import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Check, Copy, X } from "lucide-solid";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import type { TranslateError } from "../types/error";
import { getUserMessage, parseError } from "../types/error";
import { formatText } from "../utils/formatText";
import { Logger } from "../utils/logger";

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

  const runTranslation = async (clipboardText: string | null) => {
    setText("");
    setError(null);
    setIsLoading(true);

    const correlationId = crypto.randomUUID();
    Logger.info(
      "ipc",
      "quick_translate start",
      { textLength: clipboardText?.length ?? 0 },
      correlationId,
    );

    try {
      if (clipboardText?.trim()) {
        const result = await invoke<string>("quick_translate", {
          text: clipboardText,
        });
        Logger.info("ipc", "quick_translate done", { resultLength: result.length }, correlationId);
        setText(result);
      } else {
        Logger.warn("ui", "clipboard empty", undefined, correlationId);
        setError(
          parseError(
            "クリップボードにテキストがありません。テキストを選択してから再度お試しください。",
          ),
        );
      }
    } catch (e) {
      Logger.error("ipc", "quick_translate failed", { error: String(e) }, correlationId);
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
    Logger.info("lifecycle", "PopupView mounted");
    // Signal to Rust that frontend is ready
    await invoke("popup_ready");

    document.addEventListener("keydown", handleKeyDown);

    // Listen for popup-shown event from Rust (emitted in show_popup)
    // Payload contains clipboard text read by Rust to avoid race condition
    unlistenPopupShown = await listen<string | null>("popup-shown", (event) => {
      Logger.info("ui", "popup shown (⌃⌥J)", { hasClipboard: !!event.payload });
      runTranslation(event.payload);
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
    <div class="bg-gradient-subtle text-[var(--text-primary)] flex flex-col overflow-hidden">
      {/* Header with icons */}
      <div class="flex items-center justify-end gap-1 px-2 py-1 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
        <button
          type="button"
          onClick={copyText}
          disabled={isLoading() || !!error()}
          class="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
          title="Copy"
        >
          <Show when={copied()} fallback={<Copy size={14} />}>
            <Check size={14} class="text-[var(--success)]" />
          </Show>
        </button>
        <button
          type="button"
          onClick={closePopup}
          class="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-theme"
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
            <div class="space-y-2">
              <div class="h-3 rounded w-3/4 animate-skeleton" />
              <div class="h-3 rounded w-full animate-skeleton" />
              <div class="h-3 rounded w-5/6 animate-skeleton" />
            </div>
          }
        >
          <Show
            when={!error()}
            fallback={
              <p class="text-[var(--error)]">{getUserMessage(error() as TranslateError)}</p>
            }
          >
            <p class="leading-relaxed whitespace-pre-wrap wrap-break-word animate-fade-in">
              {formatText(text())}
            </p>
          </Show>
        </Show>
      </div>
    </div>
  );
}
