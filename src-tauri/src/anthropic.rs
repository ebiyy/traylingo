use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

// Pricing for Claude Haiku 4.5 (per 1M tokens)
const INPUT_PRICE_PER_MILLION: f64 = 1.0;
const OUTPUT_PRICE_PER_MILLION: f64 = 5.0;

#[derive(Serialize)]
struct MessageRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    stream: bool,
    system: String,
    temperature: f64,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct StreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(default)]
    index: Option<u32>,
    #[serde(default)]
    delta: Option<ContentDelta>,
    #[serde(default)]
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct ContentDelta {
    #[serde(rename = "type")]
    #[allow(dead_code)]
    delta_type: Option<String>,
    text: Option<String>,
}

#[derive(Deserialize, Clone)]
struct Usage {
    input_tokens: u32,
    output_tokens: u32,
}

fn calculate_cost(prompt_tokens: u32, completion_tokens: u32) -> f64 {
    let input_cost = (prompt_tokens as f64 / 1_000_000.0) * INPUT_PRICE_PER_MILLION;
    let output_cost = (completion_tokens as f64 / 1_000_000.0) * OUTPUT_PRICE_PER_MILLION;
    input_cost + output_cost
}

/// Sanitize input text by keeping only allowed characters (positive list approach).
/// This prevents special Unicode symbols from confusing the translation model.
/// See docs/input-sanitization.md for details.
fn sanitize_input(text: &str) -> String {
    text.chars()
        .filter(|c| {
            c.is_ascii_alphanumeric()        // a-zA-Z0-9
            || c.is_ascii_punctuation()      // Standard punctuation
            || c.is_whitespace()             // Space, tab, newline
            || matches!(*c, '\u{3040}'..='\u{309F}')  // Hiragana
            || matches!(*c, '\u{30A0}'..='\u{30FF}')  // Katakana
            || matches!(*c, '\u{4E00}'..='\u{9FAF}')  // CJK Unified Ideographs (Kanji)
            || matches!(*c, '\u{3000}'..='\u{303F}')  // CJK Punctuation (。、・「」『』etc.)
            || matches!(*c, '\u{FF00}'..='\u{FFEF}') // Fullwidth forms (！？etc.)
        })
        .collect()
}

// Event payload with session ID for filtering
#[derive(Serialize, Clone)]
struct ChunkPayload {
    session_id: String,
    text: String,
}

#[derive(Serialize, Clone)]
struct DonePayload {
    session_id: String,
}

#[derive(Serialize, Clone)]
struct UsagePayload {
    session_id: String,
    prompt_tokens: u32,
    completion_tokens: u32,
    estimated_cost: f64,
}

pub async fn translate_stream(
    app: AppHandle,
    text: String,
    session_id: String,
) -> Result<(), String> {
    let api_key = std::env::var("ANTHROPIC_API_KEY").map_err(|_| "ANTHROPIC_API_KEY not set")?;

    // Sanitize input to remove special symbols that confuse the model
    let sanitized_text = sanitize_input(&text);

    let client = Client::new();

    let system_prompt = "You are a Japanese-English translator.

Detect the dominant language and translate to the other language (Japanese ↔ English).

Output formatting:
- Use clear paragraph breaks for readability
- Preserve code blocks, URLs, and technical terms exactly as-is
- For lists, maintain bullet/number formatting

Only output the translation.";

    let request = MessageRequest {
        model: "claude-haiku-4-5-20251001".to_string(),
        messages: vec![Message {
            role: "user".to_string(),
            content: sanitized_text,
        }],
        max_tokens: 4096,
        stream: true,
        system: system_prompt.to_string(),
        temperature: 0.3,
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, body));
    }

    let mut stream = response.bytes_stream();
    let mut last_usage: Option<Usage> = None;
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        // Normalize line endings
        buffer.push_str(&chunk_str.replace("\r\n", "\n").replace('\r', "\n"));

        // Process complete lines only
        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].to_string();
            buffer = buffer[newline_pos + 1..].to_string();
            let line = line.trim();

            // Skip empty lines and event lines
            if line.is_empty() || line.starts_with("event:") {
                continue;
            }

            // Anthropic SSE format: "data: json"
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(event) = serde_json::from_str::<StreamEvent>(data) {
                    match event.event_type.as_str() {
                        "content_block_delta" => {
                            // Only process index 0 to avoid duplicate content blocks
                            if event.index == Some(0) {
                                if let Some(delta) = &event.delta {
                                    if let Some(text) = &delta.text {
                                        let _ = app.emit(
                                            "translate-chunk",
                                            ChunkPayload {
                                                session_id: session_id.clone(),
                                                text: text.clone(),
                                            },
                                        );
                                    }
                                }
                            }
                        }
                        "message_delta" => {
                            if let Some(usage) = event.usage {
                                last_usage = Some(usage);
                            }
                        }
                        "message_stop" => {
                            // Emit usage info before done
                            if let Some(usage) = &last_usage {
                                let cost = calculate_cost(usage.input_tokens, usage.output_tokens);
                                let _ = app.emit(
                                    "translate-usage",
                                    UsagePayload {
                                        session_id: session_id.clone(),
                                        prompt_tokens: usage.input_tokens,
                                        completion_tokens: usage.output_tokens,
                                        estimated_cost: cost,
                                    },
                                );
                            }
                            let _ = app.emit(
                                "translate-done",
                                DonePayload {
                                    session_id: session_id.clone(),
                                },
                            );
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "translate-done",
        DonePayload {
            session_id: session_id.clone(),
        },
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_cost_basic() {
        // 1000 input + 500 output tokens
        let cost = calculate_cost(1000, 500);
        // input: 1000 * 1.0 / 1_000_000 = 0.001
        // output: 500 * 5.0 / 1_000_000 = 0.0025
        assert!((cost - 0.0035).abs() < 1e-10);
    }

    #[test]
    fn test_calculate_cost_zero() {
        assert_eq!(calculate_cost(0, 0), 0.0);
    }

    #[test]
    fn test_sanitize_input_english() {
        let input = "Hello, World!";
        assert_eq!(sanitize_input(input), "Hello, World!");
    }

    #[test]
    fn test_sanitize_input_japanese() {
        let input = "こんにちは、世界！";
        assert_eq!(sanitize_input(input), "こんにちは、世界！");
    }

    #[test]
    fn test_sanitize_input_removes_special_chars() {
        let input = "Hello ✨ World 🌍";
        assert_eq!(sanitize_input(input), "Hello  World ");
    }

    #[test]
    fn test_sanitize_input_preserves_code() {
        let input = "function foo() { return 42; }";
        assert_eq!(sanitize_input(input), input);
    }
}
