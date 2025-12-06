# Legal Investigation Checklist for TrayLingo

> This document provides research questions and resources for legal due diligence.
> Consult a legal professional for formal advice.

## 1. Patent Risk Assessment

### Research Questions

- Are there patents covering "menu bar translation applications" or "clipboard-triggered translation"?
- Do existing patents cover the combination of:
  - System tray/menu bar integration
  - Clipboard monitoring for translation triggers
  - Global keyboard shortcuts for translation
  - Streaming translation display

### Search Resources

| Database | URL | Notes |
|----------|-----|-------|
| USPTO | https://www.uspto.gov/patents/search | US patents |
| Google Patents | https://patents.google.com/ | Global, free search |
| J-PlatPat | https://www.j-platpat.inpit.go.jp/ | Japanese patents |
| Espacenet | https://worldwide.espacenet.com/ | European patents |

### Suggested Search Terms

```
"translation application" AND "menu bar"
"clipboard" AND "translation" AND "shortcut"
"machine translation" AND "desktop application"
"real-time translation" AND "popup"
"system tray" AND "translation"
```

### Risk Mitigation

- TrayLingo uses standard APIs (Tauri, macOS clipboard) without novel algorithms
- Translation is performed by third-party API (Anthropic Claude), not internally
- UI patterns (menu bar apps, popups) are well-established prior art

---

## 2. Trademark Investigation

### Research Questions

- Is "TrayLingo" or similar marks registered in relevant jurisdictions?
- Are there conflicts with:
  - "Lingo" suffix products (e.g., Duolingo)
  - "Tray" prefix products
  - Translation software brands

### Search Resources

| Database | URL | Jurisdiction |
|----------|-----|--------------|
| USPTO TESS | https://tmsearch.uspto.gov/ | United States |
| EUIPO eSearch | https://euipo.europa.eu/eSearch/ | European Union |
| J-PlatPat | https://www.j-platpat.inpit.go.jp/ | Japan |
| WIPO Global Brand | https://branddb.wipo.int/ | International |

### Search Terms

```
TrayLingo
Tray Lingo
TraiLingo (typo variants)
```

### Nice Classification (Relevant Classes)

- **Class 9**: Computer software, downloadable software
- **Class 42**: Software as a service (SaaS), computer programming

---

## 3. Privacy & Data Protection

### Applicable Regulations

| Regulation | Jurisdiction | Key Requirements |
|------------|--------------|------------------|
| GDPR | EU/EEA | Consent, data minimization, right to erasure |
| CCPA/CPRA | California, USA | Disclosure, opt-out rights |
| APPI | Japan | Purpose limitation, consent for sensitive data |
| PIPEDA | Canada | Consent, purpose limitation |

### Data Flow Analysis

```
User's Clipboard Text
         ↓
┌────────────────────────────────────────────────────────────┐
│  TrayLingo App (local)                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Local Storage (settings.json)                        │  │
│  │ - API key (plaintext)                                │  │
│  │ - Translation cache (500 entries, source preview)    │  │
│  │ - Error history (last 50)                            │  │
│  │ - App settings                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         ↓                    ↓                      ↓
   Anthropic API         Sentry (opt-out)      GitHub Updater
   (translation)         (error reports)       (version check)
         ↓
Translated Text (local display + cache)
```

**macOS Permissions Required:**
- **Accessibility** (optional): For `osascript` to simulate ⌘C via System Events
- **Automation** (optional): System Events access for keyboard simulation

### Research Questions

- Does clipboard text constitute "personal data" under GDPR?
  - Yes, if it contains identifiable information
- What data does Anthropic retain?
  - Review: https://www.anthropic.com/policies/privacy
- Is explicit consent required before sending clipboard to API?
- Do we need a Data Processing Agreement (DPA) with Anthropic?

### Current Implementation Status

| Item | Status | Notes |
|------|--------|-------|
| Privacy Policy | ✅ Exists | PRIVACY.md |
| Sentry opt-out | ✅ Implemented | Settings toggle |
| Data retention disclosure | ⚠️ Check | Anthropic's retention policy |
| Consent before API call | ⚠️ Implicit | User initiates translation |

### GDPR Compliance Checklist

- [ ] Lawful basis for processing (consent or legitimate interest)
- [ ] Clear privacy policy accessible before use
- [ ] Data minimization (only send necessary data)
- [ ] Right to erasure (can user delete their data from Anthropic?)
- [ ] Data transfer safeguards (EU → US transfer)

---

## 4. Export Control Compliance

### Applicable Regulations

| Regulation | Jurisdiction | Concerns |
|------------|--------------|----------|
| EAR | United States | Encryption, restricted countries |
| Wassenaar | International | Dual-use technology |

### Research Questions

- Does TrayLingo use encryption that requires export classification?
- Is the app available to users in sanctioned countries?

### Encryption Analysis

| Component | Encryption Used | Export Concern |
|-----------|-----------------|----------------|
| HTTPS/TLS | Yes (standard) | Generally exempt |
| Local storage | Tauri plugin-store (unencrypted JSON) | No encryption |
| API key storage | settings.json (plaintext) | No encryption, user responsibility |

**Note**: API key is stored as plaintext in `settings.json`. Consider migrating to OS keychain for improved security (future enhancement).

### EAR Classification

Most open-source software using standard encryption is classified as:
- **ECCN 5D002** with **License Exception TSU** (Technology and Software Unrestricted)

Requirements for TSU:
- [ ] Publicly available source code
- [ ] Notification to BIS (Bureau of Industry and Security) - email to `crypt@bis.doc.gov`

### Sanctioned Countries (OFAC)

If distributing to users worldwide, consider blocking:
- Cuba, Iran, North Korea, Syria, Crimea region

Note: As an open-source project on GitHub, enforcement is limited, but awareness is important.

---

## 5. API Terms of Service Compliance

### Anthropic API

**Terms**: https://www.anthropic.com/policies/terms-of-service
**Usage Policy**: https://www.anthropic.com/policies/usage-policy

### Key Questions

- [ ] Can API output be displayed in a commercial application?
- [ ] Can API output be cached locally?
- [ ] Are there restrictions on translation use cases?
- [ ] What are the attribution requirements?
- [ ] Is there a requirement to disclose AI-generated content?

### Current Implementation Review

| Feature | Compliance Question |
|---------|---------------------|
| Translation Cache | Is caching API responses allowed? |
| Cost Display | Is displaying estimated costs accurate/allowed? |
| Model Selection | Are all models available for commercial use? |

---

## 6. Open Source License Compliance

### Project License

- **TrayLingo**: MIT License

### Dependency Licenses

#### Rust Dependencies
- Audited via `cargo-deny` in CI ✅
- Config: [src-tauri/deny.toml](../src-tauri/deny.toml)

#### npm Dependencies
- Audited via `pnpm licenses list` in CI ✅
- Allowlist defined in CI workflow

### License Compatibility Matrix

| License | Compatible with MIT? | Notes |
|---------|---------------------|-------|
| MIT | ✅ Yes | Permissive |
| Apache-2.0 | ✅ Yes | Permissive |
| BSD-2/3 | ✅ Yes | Permissive |
| ISC | ✅ Yes | Permissive |
| MPL-2.0 | ⚠️ Conditional | File-level copyleft |
| LGPL | ⚠️ Conditional | Linking restrictions |
| GPL | ❌ No | Strong copyleft |
| AGPL | ❌ No | Network copyleft |

---

## Action Items Summary

| Priority | Item | Owner | Status |
|----------|------|-------|--------|
| High | Review Anthropic API ToS | - | ⬜ Pending |
| High | Verify PRIVACY.md completeness | - | ✅ Done |
| Medium | USPTO trademark search | - | ⬜ Pending |
| Medium | Google Patents search | - | ⬜ Pending |
| Low | EAR notification (if needed) | - | ⬜ Pending |
| Low | J-PlatPat trademark search | - | ⬜ Pending |
| Low | Migrate API key to OS keychain | - | ⬜ Future |

---

## References

- [Anthropic Terms of Service](https://www.anthropic.com/policies/terms-of-service)
- [Anthropic Privacy Policy](https://www.anthropic.com/policies/privacy)
- [Anthropic Usage Policy](https://www.anthropic.com/policies/usage-policy)
- [GDPR Official Text](https://gdpr-info.eu/)
- [US Export Administration Regulations](https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear)
- [Open Source License Compatibility](https://opensource.org/licenses)
