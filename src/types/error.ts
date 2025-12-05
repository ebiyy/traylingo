// Matches Rust TranslateError enum (src-tauri/src/error.rs)
export type TranslateError =
  | { type: "ApiKeyMissing" }
  | { type: "AuthenticationFailed"; data: { message: string } }
  | { type: "RateLimitExceeded"; data: { retry_after_secs: number | null } }
  | { type: "Overloaded" }
  | { type: "Timeout"; data: { timeout_secs: number } }
  | { type: "NetworkError"; data: { message: string } }
  | { type: "ApiError"; data: { status: number; message: string } }
  | { type: "ParseError"; data: { message: string } }
  | { type: "Unknown"; data: { message: string } }
  | { type: "IncompleteResponse" };

/**
 * Parse error from backend - can be JSON or plain string
 */
export function parseError(error: unknown): TranslateError {
  if (typeof error === "string") {
    try {
      return JSON.parse(error) as TranslateError;
    } catch {
      return { type: "Unknown", data: { message: error } };
    }
  }
  if (typeof error === "object" && error !== null && "type" in error) {
    return error as TranslateError;
  }
  return { type: "Unknown", data: { message: String(error) } };
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: TranslateError): string {
  switch (error.type) {
    case "ApiKeyMissing":
      return "API key not configured. Please add your Anthropic API key in Settings.";
    case "AuthenticationFailed":
      return "Invalid API key. Please check your API key in Settings.";
    case "RateLimitExceeded": {
      const secs = error.data.retry_after_secs;
      return secs
        ? `Rate limit exceeded. Please wait ${secs} seconds.`
        : "Rate limit exceeded. Please wait a moment and try again.";
    }
    case "Overloaded":
      return "Claude API is currently overloaded. Please try again in a moment.";
    case "Timeout":
      return `Request timed out after ${error.data.timeout_secs} seconds. Please try again.`;
    case "NetworkError":
      return "Network error. Please check your internet connection.";
    case "ApiError":
      return `API error (${error.data.status}): ${error.data.message}`;
    case "ParseError":
      return "Failed to parse API response. Please try again.";
    case "Unknown":
      return error.data.message || "An unknown error occurred.";
    case "IncompleteResponse":
      return "Translation was interrupted. The response may be incomplete. Please try again.";
  }
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: TranslateError): boolean {
  return [
    "RateLimitExceeded",
    "Overloaded",
    "Timeout",
    "NetworkError",
    "IncompleteResponse",
  ].includes(error.type);
}

/**
 * Check if error requires settings (API key issue)
 */
export function needsSettings(error: TranslateError): boolean {
  return error.type === "ApiKeyMissing" || error.type === "AuthenticationFailed";
}

/**
 * Get suggested retry delay in milliseconds
 */
export function getRetryDelay(error: TranslateError): number {
  switch (error.type) {
    case "RateLimitExceeded":
      return (error.data.retry_after_secs ?? 5) * 1000;
    case "Overloaded":
      return 3000;
    case "Timeout":
      return 1000;
    case "NetworkError":
      return 2000;
    default:
      return 0;
  }
}

/**
 * Context for error report generation
 */
export interface ErrorReportContext {
  model?: string;
  appVersion?: string;
}

/**
 * Generate a GitHub Issue-ready error report
 */
export function generateErrorReport(error: TranslateError, context?: ErrorReportContext): string {
  const timestamp = new Date().toISOString();
  const lines = [
    "## Error Report",
    "",
    `**Type**: \`${error.type}\``,
    `**Message**: ${getUserMessage(error)}`,
    `**Time**: ${timestamp}`,
  ];

  if (context?.model) {
    lines.push(`**Model**: ${context.model}`);
  }
  if (context?.appVersion) {
    lines.push(`**Version**: ${context.appVersion}`);
  }

  // Add technical details for errors with data
  if ("data" in error) {
    lines.push("", "### Details", "```json", JSON.stringify(error.data, null, 2), "```");
  }

  return lines.join("\n");
}
