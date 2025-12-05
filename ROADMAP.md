# Roadmap

> This roadmap reflects items tracked via [GitHub Issues](https://github.com/ebiyy/traylingo/issues).
> Want to contribute? Pick an issue and submit a PR!

## In Progress

- [ ] Fix: Popup close causes other app to come to foreground

## Next Release

- [ ] Window position memory ([#9](https://github.com/ebiyy/traylingo/issues/9))
- [ ] Improve dark theme styling ([#8](https://github.com/ebiyy/traylingo/issues/8))
- [ ] Persist and display cumulative AI cost (tauri-plugin-store)

## Future

- [ ] Notification support - translation complete ([#11](https://github.com/ebiyy/traylingo/issues/11))
- [ ] First release (v0.1.0) via GitHub Actions
- [ ] Homebrew tap setup
- [ ] Language auto-detection improvements

## Under Consideration

Items requiring ROI evaluation before implementation:

- [ ] Translation history - store and search past translations
  - Pros: User convenience, avoid re-translation
  - Cons: Storage management, UI complexity, search implementation
  - Decision: Re-evaluate post-MVP

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
- [x] Quick Popup (⌘⌥J) - mini translation popup ([#6](https://github.com/ebiyy/traylingo/issues/6))
- [x] Fix: VSCode webview panels copy internal ID instead of selected text ([#7](https://github.com/ebiyy/traylingo/issues/7))
- [x] Custom tray icon (A/あ design)
- [x] App screenshot in docs/
- [x] Update CODE_OF_CONDUCT.md contact method
- [x] Error report copy feature (Copy Report button for GitHub Issues)
- [x] Incomplete response detection ([#13](https://github.com/ebiyy/traylingo/issues/13))
- [x] Error history local storage ([#14](https://github.com/ebiyy/traylingo/issues/14))
- [x] Animation for streaming text ([#10](https://github.com/ebiyy/traylingo/issues/10))

</details>
