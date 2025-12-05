import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { AlertTriangle, Check, ClipboardCopy } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import type { ErrorReportContext, TranslateError } from "../types/error";
import {
  generateErrorReport,
  getRetryDelay,
  getUserMessage,
  isRetryable,
  needsSettings,
} from "../types/error";

interface ErrorDisplayProps {
  error: TranslateError;
  onRetry: () => void;
  onOpenSettings: () => void;
  context?: ErrorReportContext;
}

export function ErrorDisplay(props: ErrorDisplayProps) {
  const [retrying, setRetrying] = createSignal(false);
  const [countdown, setCountdown] = createSignal(0);
  const [copied, setCopied] = createSignal(false);

  const handleRetry = () => {
    const delay = getRetryDelay(props.error);
    if (delay > 0) {
      setRetrying(true);
      setCountdown(Math.ceil(delay / 1000));

      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setRetrying(false);
            props.onRetry();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      props.onRetry();
    }
  };

  const handleCopyReport = async () => {
    const report = generateErrorReport(props.error, props.context);
    await writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="flex flex-col items-center justify-center p-6 text-center">
      {/* Error Icon */}
      <div class="w-12 h-12 rounded-full bg-[#8B4557]/20 flex items-center justify-center mb-4">
        <AlertTriangle size={24} class="text-[#E8A091]" />
      </div>

      {/* Error Message */}
      <p class="text-gray-300 mb-4 max-w-md text-sm">{getUserMessage(props.error)}</p>

      {/* Action Buttons */}
      <div class="flex gap-3">
        <Show when={needsSettings(props.error)}>
          <button
            type="button"
            onClick={props.onOpenSettings}
            class="px-4 py-2 bg-[#8B4557] hover:bg-[#9B5567] text-white rounded-md transition-colors text-sm"
          >
            Open Settings
          </button>
        </Show>

        <Show when={isRetryable(props.error)}>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying()}
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-md transition-colors text-sm"
          >
            {retrying() ? `Retrying in ${countdown()}s...` : "Try Again"}
          </button>
        </Show>

        {/* Copy Report Button */}
        <button
          type="button"
          onClick={handleCopyReport}
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm flex items-center gap-2"
          title="Copy error report for GitHub Issue"
        >
          <Show when={copied()} fallback={<ClipboardCopy size={14} />}>
            <Check size={14} class="text-green-400" />
          </Show>
          {copied() ? "Copied!" : "Copy Report"}
        </button>
      </div>
    </div>
  );
}
