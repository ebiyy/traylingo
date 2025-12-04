# TrayLingo - Task List

## Completed
- [x] Tauri v2 + Solid.js + Tailwind CSS v4 project setup
- [x] System tray with left-click toggle, right-click menu
- [x] Hybrid dock visibility
- [x] Window close → hide behavior
- [x] ⌘J global shortcut with auto-copy
- [x] Anthropic Claude streaming translation
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
- [x] Error handling (network, API errors, rate limits)
- [x] Settings UI (API key, model selection)
- [x] Renovate (dependency auto-update)
- [x] 翻訳中スケルトンローディング表示 (lucide-solid)
- [x] コピーボタンをアイコン化 (lucide-solid Copy/Check)
- [x] インラインSVGをlucide-solidに置換 (Settings, X, AlertTriangle)

---

## In Progress

### OSS Release Preparation
- [ ] Add app screenshot to docs/screenshot.png
- [ ] Update CODE_OF_CONDUCT.md contact method

---

## Backlog

### Features (Priority: Medium)
- [ ] AI利用コストの永続化と累積表示 (tauri-plugin-store活用)
- [ ] Notification support (translation complete)
- [ ] Language auto-detection improvements

### Polish (Priority: Low)
- [ ] Improve dark theme styling (more refined)
- [ ] Custom tray icon (A/あ design)
- [ ] Keyboard shortcuts for copy/clear
- [ ] Window position memory
- [ ] Animation for streaming text

### Distribution
- [ ] Homebrew tap setup
- [ ] First release (v0.1.0) via GitHub Actions

---

## Under Consideration

### ROI検討が必要
- [ ] ヒストリー機能 - 過去の翻訳履歴を保持・検索
  - Pros: ユーザー利便性向上、再翻訳不要
  - Cons: ストレージ、UI複雑化、検索実装コスト
  - 判断: MVP後に再評価

---

## Technical Notes

### Color Palette (from thema.md)
- Base: `gray-900` (dark)
- Text: `gray-100`
- Border: `gray-700`
- Accent: Wine red / Salmon (`#8B4557` / `#E8A091`)

### Token Pricing (Claude Haiku 4.5)
- Input: $1.0 / 1M tokens
- Output: $5.0 / 1M tokens
