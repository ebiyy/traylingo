export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogScope =
  | "ui" // UI events (clicks, shortcuts, focus)
  | "ipc" // Tauri invoke / event
  | "command" // Rust command internals
  | "network" // External API, fetch
  | "lifecycle" // App startup, shutdown, routing
  | "other";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  scope: LogScope;
  message: string;
  correlationId?: string;
  data?: unknown;
}
