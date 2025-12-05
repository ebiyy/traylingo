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
- [x] Quick Popup (⌘⌥J) - 画面右上にミニ翻訳ポップアップ表示

---

## In Progress

### Quick Popup 改善
- [x] ショートカットキー再検討 → ⌘⌥J に変更 (Finder/IntelliJ 競合回避)
- [ ] ポップアップを閉じた時に他アプリが前面に来る問題

### OSS Release Preparation
- [x] Add app screenshot to docs/
- [x] Update CODE_OF_CONDUCT.md contact method (GitHub Issues + private vulnerability reporting)

---

## Backlog

### Features (Priority: Medium)
- [ ] AI利用コストの永続化と累積表示 (tauri-plugin-store活用)
- [ ] Language auto-detection improvements

### Polish (Priority: Low)
- [x] Custom tray icon (A/あ design)

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

---

## Technical Debt

### Quick Popup タイミング依存の実装 (⌘⌥J)

現在の実装は複数のマジックナンバー（固定遅延時間）に依存しており、環境によっては不安定になる可能性がある。

#### 問題箇所

| 場所 | 値 | 用途 | リスク |
|------|-----|------|--------|
| `lib.rs` L174 | 150ms | ⌘C後のクリップボード待機 | 遅いアプリでは不足 |
| `lib.rs` L185 | 200ms | JSプリロード待機 | 遅いマシンでは不足 |
| `PopupView.tsx` L24 | 500ms | 翻訳トリガーのデバウンス | 連続操作を誤ブロック |

#### 根本原因

1. **クリップボード**: ⌘C シミュレーション後、クリップボードが更新されるまでの時間が不定
2. **JSロード**: Tauri v2 では hidden ウィンドウの Webview JS はロードされない
3. **イベント競合**: `popup-shown` イベントと `onFocusChanged` が両方発火する

#### 改善案（将来実装）

1. **クリップボード変更検知**: 固定待機ではなく、ポーリングでクリップボード内容の変化を検知
2. **Ready信号**: フロントエンドがロード完了したら `invoke("popup_ready")` でRustに通知
3. **単一トリガー**: イベントとフォーカスの両方ではなく、1つに統一してデバウンス不要に

#### 関連ファイル
- `src-tauri/src/lib.rs`: show_popup, ⌘⌥J ショートカット, プリロード
- `src/components/PopupView.tsx`: 翻訳トリガー, デバウンス処理
