# llm-cost-optimization

LLM API コストを 35-65% 削減するテクニック集。

## Topics

| Reference | 内容 |
|-----------|------|
| [caching.md](references/caching.md) | Anthropic Prompt Caching、ローカルレスポンスキャッシュ |
| [prompts.md](references/prompts.md) | プロンプト圧縮、品質を維持しながら短縮 |
| [triggers.md](references/triggers.md) | 重複トリガー防止、デバウンス |

## Key Insight

短文入力では **システムプロンプトがコストの80-87%** を占める。

## Quick Wins

1. **重複トリガーの修正** - 50%削減（無料）
2. **Prompt Caching 有効化** - 25-45%削減
3. **レスポンスキャッシュ** - 2回目以降100%削減

## Source

TrayLingo プロジェクトの `article/` から抽出:
- api-cost-optimization.md
- translation-prompt-tuning.md
- ai-request-debouncing.md
