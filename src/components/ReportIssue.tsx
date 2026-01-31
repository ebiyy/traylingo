import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, ExternalLink, Mail } from "lucide-solid";
import { createResource, createSignal, Show } from "solid-js";
import { Logger } from "../utils/logger";

// Tally pre-fill docs: https://tally.so/help/pre-populate-form-fields
const TALLY_CONFIG = {
  formId: import.meta.env.VITE_TALLY_FORM_ID || "",
  // Field names from Tally form (use the field's "question" or custom ID)
  fieldNames: {
    type: "type",
    title: "title",
    description: "description",
    version: "version",
    os: "os",
    screenshotUrl: "screenshot_url", // Hidden field for Phase 2
  },
};

const FEEDBACK_EMAIL = "feedback@example.com"; // TODO: Replace with actual email

interface ReportIssueProps {
  onBack: () => void;
}

interface AppInfo {
  version: string;
  os: string;
  arch: string;
}

type IssueType = "bug" | "feature";

export function ReportIssue(props: ReportIssueProps) {
  const [issueType, setIssueType] = createSignal<IssueType>("bug");
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");

  const [appInfo] = createResource<AppInfo>(() => invoke("get_app_info"));

  const openExternalUrl = (url: string) => {
    invoke("open_external_url", { url }).catch((err) => {
      Logger.error("ipc", "Failed to open external URL", { error: String(err), url });
    });
  };

  const handleSubmitForm = () => {
    const info = appInfo();
    const type = issueType();
    const titleText = title().trim();
    const descText = description().trim();

    if (!titleText) return;

    // DEBUG: Check if form ID is loaded
    if (!TALLY_CONFIG.formId) {
      Logger.error("ui", "VITE_TALLY_FORM_ID is not set", {
        formId: TALLY_CONFIG.formId,
      });
      return;
    }

    const typeValue = type === "bug" ? "Bug Report" : "Feature Request";
    const osValue = `${info?.os ?? "unknown"} (${info?.arch ?? "unknown"})`;

    // Tally pre-fill URL format: https://tally.so/r/{formId}?field=value
    const params = new URLSearchParams();
    params.set(TALLY_CONFIG.fieldNames.type, typeValue);
    params.set(TALLY_CONFIG.fieldNames.title, titleText);
    if (descText) {
      params.set(TALLY_CONFIG.fieldNames.description, descText);
    }
    params.set(TALLY_CONFIG.fieldNames.version, info?.version ?? "unknown");
    params.set(TALLY_CONFIG.fieldNames.os, osValue);
    // screenshot_url will be added in Phase 2

    const url = `https://tally.so/r/${TALLY_CONFIG.formId}?${params.toString()}`;
    Logger.info("ui", "Opening Tally form", { url });
    openExternalUrl(url);
  };

  const handleSendEmail = () => {
    const info = appInfo();
    const type = issueType();
    const titleText = title().trim();
    const descText = description().trim();

    const subject = `[TrayLingo ${type === "bug" ? "Bug" : "Feature"}] ${titleText || "Feedback"}`;
    const body = `${descText || "(Please describe your feedback)"}

---
Version: ${info?.version ?? "unknown"}
OS: ${info?.os ?? "unknown"} (${info?.arch ?? "unknown"})`;

    const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    openExternalUrl(mailtoUrl);
  };

  return (
    <div class="flex flex-col h-full bg-gradient-subtle text-[var(--text-primary)]">
      {/* Header */}
      <div class="sticky top-0 z-10 flex items-center gap-3 p-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <button
          type="button"
          onClick={props.onBack}
          class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 class="text-sm font-medium text-[var(--accent-secondary)]">Report Issue</h2>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-6">
        {/* Issue Type */}
        <div class="mb-6">
          <span class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Type</span>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setIssueType("bug")}
              class={`flex-1 px-4 py-2 rounded-md text-sm transition-theme ${
                issueType() === "bug"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              Bug Report
            </button>
            <button
              type="button"
              onClick={() => setIssueType("feature")}
              class={`flex-1 px-4 py-2 rounded-md text-sm transition-theme ${
                issueType() === "feature"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              Feature Request
            </button>
          </div>
        </div>

        {/* Title */}
        <div class="mb-6">
          <label
            for="issue-title"
            class="block text-sm font-medium text-[var(--text-secondary)] mb-2"
          >
            Title <span class="text-[var(--accent-primary)]">*</span>
          </label>
          <input
            id="issue-title"
            type="text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder={
              issueType() === "bug"
                ? "Brief description of the bug"
                : "Brief description of the feature"
            }
            class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--accent-primary)] transition-theme text-sm"
          />
        </div>

        {/* Description */}
        <div class="mb-6">
          <label
            for="issue-description"
            class="block text-sm font-medium text-[var(--text-secondary)] mb-2"
          >
            Description
          </label>
          <textarea
            id="issue-description"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder={
              issueType() === "bug"
                ? "What happened? What did you expect to happen?"
                : "What feature would you like? Why would it be useful?"
            }
            rows={5}
            class="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--accent-primary)] transition-theme text-sm resize-none"
          />
        </div>

        {/* App Info */}
        <div class="p-3 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-primary)] mb-6">
          <p class="text-xs text-[var(--text-muted)] mb-2">
            The following information will be included:
          </p>
          <Show
            when={!appInfo.loading}
            fallback={<p class="text-xs text-[var(--text-muted)]">Loading...</p>}
          >
            <ul class="text-xs text-[var(--text-secondary)] space-y-1">
              <li>Version: {appInfo()?.version ?? "unknown"}</li>
              <li>
                OS: {appInfo()?.os ?? "unknown"} ({appInfo()?.arch ?? "unknown"})
              </li>
            </ul>
          </Show>
        </div>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between p-4 border-t border-[var(--border-primary)]">
        <button
          type="button"
          onClick={handleSendEmail}
          class="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-theme text-sm"
          title="Send via Email"
        >
          <Mail size={16} />
          <span>Email</span>
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onBack}
            class="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-theme text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitForm}
            disabled={!title().trim()}
            class={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-theme ${
              title().trim()
                ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            <span>Send Feedback</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
