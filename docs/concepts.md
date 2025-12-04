# traylingo OpenAI Streaming 設計メモ

## 0. コンセプト

* Mac 専用の「選択 → ⌘J → 日英翻訳」ツール
* 常駐プロセス + OpenAI API（Streaming）だけを前提
* 自分用ミニマム：

  * Dock 非表示でも OK（brew services 前提）
  * UI は「左：原文 / 右：翻訳」のシンプル 2 ペイン
  * 翻訳エンジンは OpenAI 1 種類だけ（model, api_key を設定ファイルで指定）

---

## 1. 全体構成

### 1-1. プロセス構成

* 単一バイナリ `traylingo`

  * 起動モード：常駐デーモン
  * 役割：

    * グローバルショートカット登録（⌘J）
    * 選択テキストの取得（⌘C 擬似送信 → pbpaste）
    * OpenAI への翻訳リクエスト（Streaming）
    * 結果をメモリに保持
    * ローカル HTTP サーバで結果表示用ページを配信
    * macOS 通知などで「翻訳完了＋UIを開く」導線を出す

### 1-2. モジュール分割（論理）

* `config`：設定読み込み

  * `~/.config/traylingo/config.toml`
  * `api_key`, `model`, `timeout_ms` など
* `hotkey`：グローバルショートカット
* `selection`：選択テキスト取得（⌘C + pbpaste）
* `lang`：言語判定（ja / en）
* `translate`：OpenAI Streaming クライアント
* `state`：最後の翻訳結果の共有状態（Arc<Mutex<…>>）
* `http_ui`：ローカル HTTP サーバ（原文 / 翻訳を返す）
* `notify`：macOS 通知ラッパ

物理的には 1 クレートでもよいが、将来分割しやすいようにモジュール単位で整理しておく。

---

## 2. UX フロー

### 2-1. 基本 UX

1. ユーザーが任意のアプリでテキスト選択
2. ⌘J を押下
3. `traylingo` のグローバルショートカットハンドラが発火
4. `selection::capture_selection()` で：

   * AppleScript で frontmost app に ⌘C 送信
   * 少し待ってから `pbpaste` でテキスト取得
5. 取得テキストを `lang::detect_lang()` で判定

   * 日本語 → 英語
   * それ以外 → 日本語
6. `translate::stream_translate()` を呼び、OpenAI から Streaming で翻訳結果を受信
7. 受信チャンクを逐次バッファに追記しつつ、`state` に反映
8. 翻訳完了後：

   * `state` に最終結果を保存
   * macOS 通知で「翻訳完了」を表示（クリックで UI を開く）

### 2-2. 結果表示 UX

* 結果を見たい場合：

  * 通知クリック or メニューバーアイコン or ショートカット（例：⌘⌥J）で
  * `open http://127.0.0.1:7777` を呼ぶ
* ブラウザに表示されるページ：

  * 左ペイン：原文（最後に翻訳したテキスト）
  * 右ペイン：翻訳結果
  * UI は CSS だけで完結（JS なしでも可）

Streaming の進行中に UI を開く場合は：

* HTTP ハンドラが `state` の「現時点の翻訳テキスト」を返す
* ページ側はシンプルな meta refresh（1〜2秒ごと再読込）や JS のポーリングで更新してもよい（v1 では後回しでも可）

---

## 3. OpenAI Streaming 設計

### 3-1. リクエスト方針

* エンドポイント：`/v1/chat/completions` または `/v1/responses` のいずれか
* v1 では馴染みのある `chat/completions` を仮採用
* リクエスト例（概念）：

  * `model`: config.toml で指定（例: `gpt-4.1-mini`）
  * `stream`: true
  * `messages`:

    * system: 「翻訳専用。src→dst で自然な翻訳だけを返す。前後に余計な文言は付けない」
    * user: 原文テキスト

### 3-2. Streaming の扱い（Rust）

* HTTP クライアント：`reqwest` の streaming 対応を利用
* SSE パース：

  * シンプルに `lines()` で行ごとに読む
  * `data:` プレフィックス以降を JSON としてパース
  * `choices[0].delta.content` を取り出し、バッファに追記
* 設計ポイント：

  * `translate::stream_translate()` は **同期 API** にしても良い

    * 内部で streaming を処理し、最終結果を `String` で返す
    * 途中経過を UI にリアルタイム反映したくなったときのために、

      * コールバック or チャンネルでチャンクを `state` に push できるようにしておく

#### 3-2-1. 関数インターフェース案

```rust
fn stream_translate(
    config: &Config,
    src_lang: &str,
    dst_lang: &str,
    text: &str,
    on_chunk: impl FnMut(&str),
) -> anyhow::Result<String>;
```

* `on_chunk`：新しいチャンクが届くたびに呼び出す

  * ここで `state` に「現時点の translated_text」を書き込む
  * 将来 UI 側のリアルタイム表示に使える
* 返り値：最終翻訳結果

### 3-3. プロンプト設計（最低限）

* system:

  * 「あなたは翻訳エンジンです。入力の言語は {src}、出力の言語は {dst} です。入力文を、意味を変えず自然な形で翻訳してください。翻訳結果のみを返し、前後にコメントや説明は付けないでください。」
* user:

  * 原文全文

→ これで Streaming しても「翻訳本体だけ」がチャンクとして流れてくる想定。

---

## 4. 状態管理（state）

### 4-1. 共有状態構造体

```rust
struct LastResult {
    original: String,
    translated: String,
    updated_at: SystemTime,
}
```

* `Arc<Mutex<Option<LastResult>>>` を `AppState` として保持
* `on_chunk` と HTTP ハンドラから共用

### 4-2. 更新タイミング

* 翻訳開始時：

  * `original` を先に `state` に書き込み
  * `translated` は空文字から開始
* チャンク到着時：

  * `translated` に追記
  * `updated_at` を更新
* 完了時：

  * 最終結果で上書き（状態的には途中と同じだが、内部的に完了フラグを持ってもよい）

---

## 5. HTTP UI

### 5-1. サーバ仕様

* ポート：`127.0.0.1:7777` 固定（設定で変更可能にしても良い）
* ルーティング：

  * `GET /`：最新の結果画面 HTML
  * `GET /health`：簡易ヘルスチェック

### 5-2. `/` 応答

* `state` から `LastResult` を読み込み
* 存在しなければ「まだ翻訳結果がありません」的なプレースホルダ
* 存在すれば、原文・翻訳を HTML に埋め込み

### 5-3. HTML UI（要件）

* 左右 2 ペイン

  * 左：原文
  * 右：翻訳
* スタイル：

  * system-ui フォント
  * `white-space: pre-wrap;` で改行維持
  * 余計な装飾なし

---

## 6. 設定・環境変数

### 6-1. 設定ファイル

* パス：`~/.config/traylingo/config.toml`
* 項目例：

```toml
api_key = "sk-..."
model = "gpt-4.1-mini"
request_timeout_ms = 8000
openai_base_url = "https://api.openai.com/v1"
```

### 6-2. 優先順位

* 環境変数 > 設定ファイル

  * `NANIRS_OPENAI_API_KEY`
  * `NANIRS_OPENAI_MODEL`

---

## 7. エラー処理ポリシー

* 選択テキスト取得失敗：

  * クリップボードが空の場合 → 通知で「テキストが取得できませんでした」
* OpenAI API エラー：

  * ステータスコードと簡易メッセージを通知
  * `state` は更新しない or エラー内容を `translated` として残す
* ネットワークタイムアウト：

  * 通知で「翻訳がタイムアウトしました」

---

## 8. 起動と配布（概要）

* 配布：

  * GitHub リポジトリ（MIT or Apache-2.0）
  * Homebrew tap で `brew install your/tap/traylingo`
* 常駐：

  * `brew services start traylingo`
  * ログは `~/Library/Logs/traylingo.log` など

---

## 9. v1 スコープ

* OpenAI のみ
* Streaming で翻訳（内部でチャンク処理）
* UI はローカル HTTP + ブラウザ
* グローバルショートカットは ⌘J 固定（設定なし）
* 設定は APIキーと model だけ

これ以上は "使ってから" 考える、くらいのゆるい前提でスタートする。
