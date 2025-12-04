# TrayLingo - Task List

## Completed
- [x] Tauri v2 + Solid.js + Tailwind CSS v4 project setup
- [x] System tray with left-click toggle, right-click menu
- [x] Hybrid dock visibility
- [x] Window close → hide behavior
- [x] ⌘J global shortcut with auto-copy
- [x] OpenAI streaming translation
- [x] Basic 2-pane UI

---

## In Progress

### UI Polish
- [ ] Apply wine red / salmon accent colors (from thema.md)
- [ ] Add scroll support for long texts
- [ ] Add copy button for translated text
- [ ] Improve dark theme styling

### Translation Formatting
- [ ] Auto-format translated text based on language
  - Japanese: proper line breaks, punctuation
  - English: paragraph formatting
- [ ] Preserve code blocks and technical formatting

### Cost Estimation
- [ ] Track token usage per request
- [ ] Display estimated cost (gpt-4o-mini: $0.15/1M input, $0.60/1M output)
- [ ] Show cumulative session cost

---

## Backlog

### Features
- [ ] Copy translation result to clipboard (one-click)
- [ ] Notification support (translation complete)
- [ ] Language auto-detection improvements
- [ ] Error handling improvements (network, API errors)
- [ ] Settings UI (API key, model selection)

### Polish
- [ ] Custom tray icon (A/あ design)
- [ ] Keyboard shortcuts for copy/clear
- [ ] Window position memory
- [ ] Animation for streaming text

### Distribution
- [ ] Homebrew tap setup
- [ ] GitHub releases automation
- [ ] README with screenshots

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
