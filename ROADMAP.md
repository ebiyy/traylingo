# Roadmap

> This roadmap reflects items tracked via [GitHub Issues](https://github.com/ebiyy/traylingo/issues).
> Want to contribute? Pick an issue and submit a PR!

## In Progress

- [ ] Bug: First shortcut trigger often times out (clipboard not captured) ([#22](https://github.com/ebiyy/traylingo/issues/22))

## Next Release

- [ ] Refactor: Remove unreliable monitor_from_point() API usage ([#30](https://github.com/ebiyy/traylingo/issues/30))

## v0.2.0

- [ ] Persist and display cumulative AI cost (tauri-plugin-store)
- [ ] Usage history for token/cost analysis ([#20](https://github.com/ebiyy/traylingo/issues/20))

## v0.1.0

- [ ] First release via GitHub Actions
- [ ] Homebrew tap setup

## Legal / Compliance

- [ ] Review Anthropic API Terms of Service for commercial use compliance
- [ ] Complete legal investigation checklist (see [docs/legal-investigation.md](docs/legal-investigation.md))

## Future

- [ ] Language auto-detection improvements
- [ ] Use tauri-plugin-shell for external links (Settings.tsx Anthropic Console link)
- [ ] Configurable popup auto-close delay (currently hardcoded 8s)
- [ ] Fix: `message_stopped` logic bug in anthropic.rs (initialized but never set to true)
- [ ] Add data management UI (clear cache, clear error history, clear all data)

## Under Consideration

Items requiring ROI evaluation before implementation:

- [ ] Markdown rendering for translated text
  - Pros: Better readability for technical docs, syntax highlighting
  - Cons: Bundle size (+15-30KB), XSS risk, complexity
  - Alternative: Code block highlighting only (smaller scope)
  - Decision: Low priority - revisit if user feedback requests it

## Completed

<details>
<summary>Click to expand</summary>

- [x] Tauri v2 + Solid.js + Tailwind CSS v4 project setup
- [x] System tray with left-click toggle, right-click menu
- [x] Hybrid dock visibility
- [x] Window close → hide behavior
- [x] ⌘J global shortcut with auto-copy
- [x] Anthropic Claude streaming translation
- [x] Basic 2-pane UI
- [x] Wine red / salmon accent colors
- [x] Scroll support for long texts
- [x] Copy button for translated text
- [x] Auto-format translated text (Japanese line breaks)
- [x] Token usage tracking per request
- [x] Estimated cost display per request
- [x] Cumulative session cost display
- [x] Preserve code blocks and technical formatting
- [x] OSS documentation (LICENSE, README, CONTRIBUTING, etc.)
- [x] GitHub Actions CI/CD workflows
- [x] Issue/PR templates
- [x] Error handling (network, API errors, rate limits)
- [x] Settings UI (API key, model selection)
- [x] Renovate (dependency auto-update)
- [x] Skeleton loading during translation
- [x] Icon-based copy button (lucide-solid)
- [x] Replace inline SVGs with lucide-solid
- [x] Quick Popup (⌃⌥J) - mini translation popup ([#6](https://github.com/ebiyy/traylingo/issues/6))
- [x] Fix: VSCode webview panels copy internal ID instead of selected text ([#7](https://github.com/ebiyy/traylingo/issues/7))
- [x] Custom tray icon (A/あ design)
- [x] App screenshot in docs/
- [x] Update CODE_OF_CONDUCT.md contact method
- [x] Error report copy feature (Copy Report button for GitHub Issues)
- [x] Incomplete response detection ([#13](https://github.com/ebiyy/traylingo/issues/13))
- [x] Error history local storage ([#14](https://github.com/ebiyy/traylingo/issues/14))
- [x] Animation for streaming text ([#10](https://github.com/ebiyy/traylingo/issues/10))
- [x] Window position memory ([#9](https://github.com/ebiyy/traylingo/issues/9))
- [x] Improve dark theme styling ([#8](https://github.com/ebiyy/traylingo/issues/8))
- [x] Privacy Policy (PRIVACY.md) and Sentry opt-out toggle in Settings
- [x] Notification support (translation complete) ([#11](https://github.com/ebiyy/traylingo/issues/11))
- [x] Fix: Popup close causes other app to come to foreground
- [x] Security: Enable CSP in tauri.conf.json
- [x] Security: Mask sensitive data (clipboard text) in Sentry PII
- [x] Bug: Update event listeners not cleaned up in App.tsx (memory leak on HMR)
- [x] Consistency: Japanese error message in PopupView.tsx (should be English)
- [x] Auto-update via tauri-plugin-updater (Check for Updates in tray menu)
- [x] ~~Bug: Multi-monitor detection fails intermittently~~ ([#21](https://github.com/ebiyy/traylingo/issues/21)) - Closed: Won't fix due to Tauri API limitations
- [x] npm dependency license audit in CI (`pnpm licenses:check`)
- [x] Bug: Global shortcut triggers twice per single key press ([#23](https://github.com/ebiyy/traylingo/issues/23))
- [x] Sentry: Capture Rust panics before process abort ([#29](https://github.com/ebiyy/traylingo/issues/29))
- [x] Refactor: Extract system prompt constant (duplicated in translate_stream/translate_once)
- [x] Fix: Log format order in app_log (timestamp should come first)
- [x] Sentry: Add environment tag and allowUrls for noise reduction

</details>
