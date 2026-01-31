# 引き継ぎ: Report Issue機能

## 現在の状態

### 実装済み（未コミット）
- `src-tauri/src/lib.rs` - `get_app_info` コマンド追加
- `src/App.tsx` - `"report"` view追加
- `src/components/Settings.tsx` - 「Report Issue」リンク追加
- `src/components/ReportIssue.tsx` - 新規作成（モックID）

```bash
git status --short
# M src-tauri/src/lib.rs
# M src/App.tsx
# M src/components/Settings.tsx
# ?? src/components/ReportIssue.tsx
```

### モックID箇所
`src/components/ReportIssue.tsx:6-19` にTODOコメント付き:
- `TALLY_CONFIG.formId` - Tallyフォーム作成後に置換
- `TALLY_CONFIG.fieldNames.*` - フィールド名（デフォルトでOKの場合が多い）
- `FEEDBACK_EMAIL` - メール送信用

## 設計決定事項

### 方式: Option B（ハイブリッド）
- **外部フォーム**: Tally（問い合わせ本文）
- **自前**: 画像アップロードのみ（R2 + Worker）

### アーキテクチャ
```
[アプリ]
  ↓ POST /init (レート制限)
[Worker]
  ↓ 署名URL生成 + viewUrl返却
[アプリ]
  ↓ PUT uploadUrl (R2直接)
  ↓ Tally開く (screenshot_url=viewUrl)
[Tally]
```

### 重要な制約
1. **署名URLはWorker側で生成**（R2クレデンシャルをアプリに入れない）
2. **画像URLはWorker経由** (`worker.domain/o/<key>`)、R2直接公開しない
3. **R2 Lifecycle**で14日後自動削除
4. **レート制限**: 10回/時間/IP

## 次のステップ

### Phase 1: フォーム準備
1. [ ] Tally作成（フィールド: Type, Title, Description, Version, OS, screenshot_url[hidden]）
2. [ ] Form IDを取得（URLの `tally.so/r/{formId}` 部分）
3. [ ] `ReportIssue.tsx`のモックIDを置換（`TALLY_CONFIG.formId`）

### Phase 2: 画像アップロード（後から追加）
1. [ ] Cloudflare Worker作成（/init, /o/:key）
2. [ ] R2バケット作成（Lifecycle設定）
3. [ ] アプリ側スクショ添付UI（tauri-plugin-screenshots）

## 関連Issue
- [#55](https://github.com/ebiyy/traylingo/issues/55) - ⌘Jクリップボードバグ（別件）

## 参考資料
- Tally プリフィル: https://tally.so/help/pre-populate-form-fields
- R2 署名URL: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- R2 Lifecycle: https://developers.cloudflare.com/r2/buckets/object-lifecycles/
- Worker Rate Limiting: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

## 動作確認
```bash
pnpm tauri dev
# Settings → Report Issue → フォーム表示確認
```
