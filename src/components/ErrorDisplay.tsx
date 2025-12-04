import { createSignal, Show } from "solid-js";
import type { TranslateError } from "../types/error";
import { getRetryDelay, getUserMessage, isRetryable, needsSettings } from "../types/error";

interface ErrorDisplayProps {
  error: TranslateError;
  onRetry: () => void;
  onOpenSettings: () => void;
}

export function ErrorDisplay(props: ErrorDisplayProps) {
  const [retrying, setRetrying] = createSignal(false);
  const [countdown, setCountdown] = createSignal(0);

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

  return (
    <div class="flex flex-col items-center justify-center p-6 text-center">
      {/* Error Icon */}
      <div class="w-12 h-12 rounded-full bg-[#8B4557]/20 flex items-center justify-center mb-4">
        <svg
          class="w-6 h-6 text-[#E8A091]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          role="img"
          aria-label="Error"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
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
      </div>
    </div>
  );
}
