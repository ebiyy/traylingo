# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in TrayLingo, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

## Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix release**: Depends on severity

## Security Best Practices for Users

### API Key Safety

- Never commit your `.env` file or API keys to version control
- Use environment variables for API key configuration
- Rotate your API key if you suspect it has been exposed

### Network Security

- TrayLingo communicates only with OpenAI's API over HTTPS
- No data is stored or transmitted to any other servers

## Scope

This security policy covers:
- The TrayLingo application code
- Official releases and builds
- Documentation

Out of scope:
- OpenAI API security (report to OpenAI directly)
- User's local environment configuration
