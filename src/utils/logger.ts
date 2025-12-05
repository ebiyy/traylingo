import { invoke } from "@tauri-apps/api/core";
import type { LogEntry, LogLevel, LogScope } from "../types/logging";

function createEntry(
  level: LogLevel,
  scope: LogScope,
  message: string,
  data?: unknown,
  correlationId?: string,
): LogEntry {
  return {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    data,
    correlationId,
  };
}

async function sendToBackend(entry: LogEntry): Promise<void> {
  try {
    await invoke("app_log", { entry });
  } catch {
    // Silent fail - don't break the app due to logging failure
  }
}

function log(
  level: LogLevel,
  scope: LogScope,
  message: string,
  data?: unknown,
  correlationId?: string,
): void {
  const entry = createEntry(level, scope, message, data, correlationId);

  // Output to DevTools for development visibility
  const prefix = `[${entry.level}] [${entry.scope}]`;
  const corrSuffix = entry.correlationId ? ` [corr=${entry.correlationId}]` : "";
  const logMessage = `${prefix}${corrSuffix} ${entry.message}`;

  switch (level) {
    case "debug":
      // biome-ignore lint/suspicious/noConsole: Logger wrapper intentionally uses console
      console.debug(logMessage, entry.data ?? "");
      break;
    case "info":
      // biome-ignore lint/suspicious/noConsole: Logger wrapper intentionally uses console
      console.info(logMessage, entry.data ?? "");
      break;
    case "warn":
      // biome-ignore lint/suspicious/noConsole: Logger wrapper intentionally uses console
      console.warn(logMessage, entry.data ?? "");
      break;
    case "error":
      // biome-ignore lint/suspicious/noConsole: Logger wrapper intentionally uses console
      console.error(logMessage, entry.data ?? "");
      break;
  }

  // Send to Rust backend for unified logging
  void sendToBackend(entry);
}

export const Logger = {
  debug: (scope: LogScope, message: string, data?: unknown, correlationId?: string): void =>
    log("debug", scope, message, data, correlationId),
  info: (scope: LogScope, message: string, data?: unknown, correlationId?: string): void =>
    log("info", scope, message, data, correlationId),
  warn: (scope: LogScope, message: string, data?: unknown, correlationId?: string): void =>
    log("warn", scope, message, data, correlationId),
  error: (scope: LogScope, message: string, data?: unknown, correlationId?: string): void =>
    log("error", scope, message, data, correlationId),
};
