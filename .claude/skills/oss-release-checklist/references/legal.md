# Legal Compliance

## API Terms of Service

### Why It Matters

Using an API without reading ToS can result in:
- Account suspension
- Legal action
- Feature violations (e.g., caching when prohibited)

### What to Check

| Item | Question |
|------|----------|
| Commercial use | Is OSS distribution allowed? |
| User API keys | Can users provide their own keys? |
| Caching | Is response caching permitted? |
| Output labeling | Must AI content be disclosed? |

## License Audit

### The GPL Trap

One GPL dependency infects your entire project:

```
MIT Project
    └── GPL Library  ← Entire project now GPL
```

### Rust: cargo-deny

```bash
cargo install cargo-deny
cargo deny check
```

```toml
# deny.toml
[licenses]
allow = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Zlib"]
deny = ["GPL-2.0", "GPL-3.0", "AGPL-3.0"]
```

### npm: license check script

```javascript
// scripts/check-licenses.mjs
const ALLOWED = ["MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "MPL-2.0"];
// Compare against installed packages
```

### CI Integration

```yaml
- name: License check (Rust)
  run: cargo deny check
  working-directory: src-tauri

- name: License check (npm)
  run: pnpm licenses:check
```

### License Compatibility

| License | MIT Compatible | Notes |
|---------|----------------|-------|
| MIT | ✅ | Safe |
| Apache-2.0 | ✅ | Safe |
| BSD-2/3 | ✅ | Safe |
| ISC | ✅ | Safe |
| MPL-2.0 | ⚠️ | File-level copyleft (OK if not modified) |
| LGPL | ⚠️ | Dynamic linking OK, static risky |
| GPL | ❌ | Infects entire project |
| AGPL | ❌ | Network copyleft, very viral |

## Trademark Risk

### What to Check

Before public release, search:

| Database | Region | URL |
|----------|--------|-----|
| USPTO TESS | US | https://tmsearch.uspto.gov/ |
| EUIPO | EU | https://euipo.europa.eu/eSearch/ |
| J-PlatPat | Japan | https://www.j-platpat.inpit.go.jp/ |
| WIPO | International | https://branddb.wipo.int/ |

Search your app name and common typos in:
- Class 9 (software)
- Class 42 (SaaS, programming)

### When to Get Professional Help

| Phase | Action |
|-------|--------|
| OSS release | Basic search yourself |
| Commercial launch | Hire trademark attorney |

## Document Consistency

### Common Contradictions

| File | Mistake |
|------|---------|
| SECURITY.md | Lists one API but code uses more |
| docs/*.md | References old API provider |
| README | Outdated setup instructions |

### Verification

1. Grep for all network destinations in code
2. Compare against SECURITY.md list
3. Ensure PRIVACY.md covers all third-party services

## Professional Consultation

### OSS Only

Usually safe with technical measures:
- License audits
- PRIVACY.md
- Document accuracy

### Commercializing

Consider professional review:

| Expert | Purpose | Est. Cost |
|--------|---------|-----------|
| Trademark attorney | Search + registration | $300-1500 |
| Privacy counsel | GDPR/CCPA compliance | $500-2000+ |
| Legal review | API ToS interpretation | $200-500/hr |
