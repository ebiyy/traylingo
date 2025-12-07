# Privacy Policy

TrayLingo uses Sentry for error monitoring to improve app stability.

## Data Collected

- Error reports (stack traces, error messages)
- Device information (OS version, app version)
- Session data for debugging

## Data NOT Collected (by Sentry)

- **Translation content** - All text, clipboard, and translation data is scrubbed before sending
- **API keys** - Filtered from error reports
- **IP addresses** - `sendDefaultPii` is disabled (IP addresses are not attached to error events)

## Local Storage

TrayLingo stores the following data locally on your device (`settings.json`):

| Data | Purpose | Retention |
|------|---------|-----------|
| API key | Anthropic API authentication | Until you change it |
| Translation cache | Avoid redundant API calls | Up to 100 entries, auto-expires after 30 days |
| Source text preview | Cache lookup display | First 30 characters (with sensitive data masked) |
| Error history | Debugging | Last 50 errors |
| App settings | Preferences (cache toggle, telemetry) | Until you change them |

**Note**: Your API key is stored locally in `settings.json` and is never sent anywhere except to Anthropic's API.

### Privacy Controls

- **Cache Toggle**: Disable translation cache entirely in Settings
- **Clear Cache**: One-click button to delete all cached translations
- **Auto-Expiry**: Cache entries automatically expire after 30 days
- **Sensitive Data Masking**: Email addresses, URLs, and long numbers are masked in cache previews

Delete `settings.json` to clear all local data.

## Opt-Out

Error reporting is **enabled by default**. You can disable it entirely in Settings > "Send error reports".

Changes take effect after restarting the app.

## Third Party Services

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| **Anthropic API** | Translation | [anthropic.com/privacy](https://www.anthropic.com/policies/privacy) |
| **Sentry** | Error monitoring | [sentry.io/privacy](https://sentry.io/privacy/) |
| **GitHub** | Auto-update checks | [docs.github.com/privacy](https://docs.github.com/en/site-policy/privacy-policies) |

## Open Source

This app is open source (MIT License). Verify data handling in source code:
https://github.com/ebiyy/traylingo

## Contact

For privacy concerns, open an issue on GitHub.
