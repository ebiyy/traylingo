# Input Sanitization

## Overview

TrayLingo sanitizes input text before sending it to the translation API. This is a **critical** feature that significantly improves translation quality.

## Why Sanitization Matters

Special Unicode symbols (like `⏺`, `▶`, `◆`, emoji-like characters) can confuse the LLM:
- They tokenize unpredictably
- The model may interpret them as meaningful content
- Output quality degrades significantly

**Example**: Text copied from CLI tools often contains special bullet points (`⏺`) that look like bullet points but are actually Unicode symbols that pollute the translation.

## Approach: Positive List (Allowlist)

Instead of trying to block bad characters (negative list), we **only allow known-good characters**. This is more robust against unknown special characters.

### Allowed Characters

| Category | Unicode Range | Examples |
|----------|---------------|----------|
| ASCII Alphanumeric | `a-zA-Z0-9` | Letters, numbers |
| ASCII Punctuation | Standard | `! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ \` { \| } ~` |
| Whitespace | - | Space, tab, newline |
| Hiragana | `U+3040-U+309F` | あいうえお |
| Katakana | `U+30A0-U+30FF` | アイウエオ |
| Kanji (CJK) | `U+4E00-U+9FAF` | 漢字 |
| CJK Punctuation | `U+3000-U+303F` | 。、・「」『』 |
| Fullwidth Forms | `U+FF00-U+FFEF` | ！？ |

### Characters Removed

Any character not in the above ranges is silently removed, including:
- `⏺` (U+23FA) - Black circle for record
- `●` (U+25CF) - Black circle
- `▶` (U+25B6) - Play button
- Various emoji and special symbols
- Control characters

## Implementation

Located in `src-tauri/src/openai.rs`:

```rust
fn sanitize_input(text: &str) -> String {
    text.chars()
        .filter(|c| {
            c.is_ascii_alphanumeric()
            || c.is_ascii_punctuation()
            || c.is_whitespace()
            || matches!(*c, '\u{3040}'..='\u{309F}')  // Hiragana
            || matches!(*c, '\u{30A0}'..='\u{30FF}')  // Katakana
            || matches!(*c, '\u{4E00}'..='\u{9FAF}')  // Kanji
            || matches!(*c, '\u{3000}'..='\u{303F}')  // CJK Punctuation
            || matches!(*c, '\u{FF00}'..='\u{FFEF}')  // Fullwidth forms
        })
        .collect()
}
```

## Maintenance

If you encounter characters that should be allowed but are being filtered:
1. Identify the Unicode range
2. Add to the allowlist in `sanitize_input()`
3. Update this document

## Related

- [Architecture](architecture.md) - System design overview
- [Unicode Charts](https://unicode.org/charts/)
- [CJK Unicode Blocks](https://en.wikipedia.org/wiki/CJK_Unified_Ideographs)
