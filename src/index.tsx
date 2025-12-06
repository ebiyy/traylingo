/* @refresh reload */
import * as Sentry from "@sentry/solid";
import { render } from "solid-js/web";
import "./index.css";
import App from "./App";
import { PopupView } from "./components/PopupView";

// =============================================================================
// Telemetry Opt-out Flag
// =============================================================================
// This flag controls whether error reports are sent to Sentry.
// Updated via setTelemetryEnabled() when user changes settings.
// Default: true (opt-out model - users must explicitly disable)
// =============================================================================
let telemetryEnabled = true;

/**
 * Update telemetry enabled state.
 * Called from Settings component when user toggles "Send error reports".
 */
export function setTelemetryEnabled(enabled: boolean) {
  telemetryEnabled = enabled;
}

// =============================================================================
// IMPORTANT: Privacy Protection - Sentry PII Masking
// =============================================================================
// This app handles sensitive user data (clipboard text for translation).
// We MUST scrub any text content before sending to Sentry to protect user privacy.
//
// DO NOT:
// - Add sendDefaultPii: true (sends IP, user agent, etc.)
// - Log clipboard/translation text in Sentry breadcrumbs or extra data
// - Remove or weaken the beforeSend filter below
//
// If adding new Sentry integrations, ensure they don't leak user text content.
// =============================================================================
Sentry.init({
  dsn: "https://12cc4e2328693a567ba7580e40f8b3f1@o4503930312261632.ingest.us.sentry.io/4510482273009664",
  environment: import.meta.env.PROD ? "production" : "development",
  // WHY: DSN is public in OSS. allowUrls reduces noise from non-app sources.
  // This is NOT a security boundary - just noise reduction.
  allowUrls: [
    /localhost:1420/, // dev (Vite)
    /tauri:\/\/localhost/, // prod (macOS / Linux)
    /tauri\.localhost/, // prod (Windows)
  ],
  beforeSend(event) {
    // Check opt-out first - drop all events if telemetry disabled
    if (!telemetryEnabled) {
      return null;
    }

    // WHY: Users paste sensitive content (emails, passwords, private messages) for translation.
    // This data MUST NOT be sent to external services.
    if (event.breadcrumbs) {
      for (const breadcrumb of event.breadcrumbs) {
        if (breadcrumb.data) {
          delete breadcrumb.data.text;
          delete breadcrumb.data.translation;
          delete breadcrumb.data.clipboard;
        }
      }
    }
    return event;
  },
});

const root = document.getElementById("root") as HTMLElement;
const hash = window.location.hash;
const isPopup = hash.startsWith("#/popup");

render(() => (isPopup ? <PopupView /> : <App />), root);
