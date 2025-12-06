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
| API key | Authentication | Until you change it |
| Translation cache | Avoid redundant API calls | Up to 500 entries (LRU eviction) |
| Source text preview | Cache lookup display | First 100 characters per entry |
| Error history | Debugging | Last 50 errors |
| App settings | Preferences | Until you change them |

**Note**: Translation cache includes the full translated text and a preview of the source text. Delete `settings.json` to clear all local data.

## Opt-Out

You can disable error reporting entirely in Settings > "Send error reports"

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
