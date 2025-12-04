# TrayLingo - Task List

## Completed
- [x] Tauri v2 + Solid.js + Tailwind CSS v4 project setup
- [x] System tray with left-click toggle, right-click menu
- [x] Hybrid dock visibility
- [x] Window close → hide behavior
- [x] ⌘J global shortcut with auto-copy
- [x] OpenAI streaming translation
- [x] Basic 2-pane UI
- [x] Wine red / salmon accent colors (#8B4557 / #E8A091)
- [x] Scroll support for long texts (overflow-y-auto)
- [x] Copy button for translated text
- [x] Auto-format translated text (Japanese line breaks)
- [x] Token usage tracking per request
- [x] Estimated cost display per request
- [x] Cumulative session cost display
- [x] Preserve code blocks and technical formatting
- [x] OSS documentation (LICENSE, README, CONTRIBUTING, etc.)
- [x] GitHub Actions CI/CD workflows
- [x] Issue/PR templates

---

## In Progress

### OSS Release Preparation
- [ ] Add app screenshot to docs/screenshot.png
- [ ] Update CODE_OF_CONDUCT.md contact method

---

## Backlog

### Features
- [ ] Notification support (translation complete)
- [ ] Language auto-detection improvements
- [ ] Error handling improvements (network, API errors)
- [ ] Settings UI (API key, model selection)

### Polish
- [ ] Improve dark theme styling (more refined)
- [ ] Custom tray icon (A/あ design)
- [ ] Keyboard shortcuts for copy/clear
- [ ] Window position memory
- [ ] Animation for streaming text

### Distribution
- [ ] Homebrew tap setup
- [ ] First release (v0.1.0) via GitHub Actions

---

## Technical Notes

### Color Palette (from thema.md)
- Base: `gray-900` (dark)
- Text: `gray-100`
- Border: `gray-700`
- Accent: Wine red / Salmon (`#8B4557` / `#E8A091`)

### Token Pricing (gpt-4o-mini)
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- Estimate: ~750 tokens/1000 chars
