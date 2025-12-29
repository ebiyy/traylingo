# oss-release-checklist

OSS 公開前に確認すべきセキュリティ・法務・プライバシー項目。

## Topics

| Reference | 内容 |
|-----------|------|
| [security.md](references/security.md) | CSP、Sentry PII、シークレット管理 |
| [legal.md](references/legal.md) | ライセンス監査、API利用規約、商標 |
| [privacy.md](references/privacy.md) | プライバシーポリシー、オプトアウト、GDPR |

## Risk Matrix

| Issue | Severity |
|-------|----------|
| CSP `null` | 🔴 Critical |
| `sendDefaultPii: true` | 🔴 Critical |
| GPL dependency | 🔴 Critical |
| No privacy policy | 🟠 High |

## Quick Commands

```bash
cargo deny check          # Rust ライセンス監査
pnpm licenses:check       # npm ライセンス監査
```

## Source

TrayLingo プロジェクトの `article/` から抽出:
- oss-legal-checklist.md
- pre-release-security-checklist.md
- oss-security-audit-implementation.md
