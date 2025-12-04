use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

// Pricing for gpt-4o-mini (per 1M tokens)
const INPUT_PRICE_PER_MILLION: f64 = 0.15;
const OUTPUT_PRICE_PER_MILLION: f64 = 0.60;

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<Message>,
    stream: bool,
    stream_options: StreamOptions,
}

#[derive(Serialize)]
struct StreamOptions {
    include_usage: bool,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatChunk {
    choices: Vec<Choice>,
    #[serde(default)]
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct Choice {
    delta: Delta,
}

#[derive(Deserialize)]
struct Delta {
    content: Option<String>,
}

#[derive(Deserialize)]
struct Usage {
    prompt_tokens: u32,
    completion_tokens: u32,
}

#[derive(Serialize, Clone)]
struct UsageInfo {
    prompt_tokens: u32,
    completion_tokens: u32,
    estimated_cost: f64,
}

fn calculate_cost(prompt_tokens: u32, completion_tokens: u32) -> f64 {
    let input_cost = (prompt_tokens as f64 / 1_000_000.0) * INPUT_PRICE_PER_MILLION;
    let output_cost = (completion_tokens as f64 / 1_000_000.0) * OUTPUT_PRICE_PER_MILLION;
    input_cost + output_cost
}

pub async fn translate_stream(app: AppHandle, text: String) -> Result<(), String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY not set")?;

    let client = Client::new();

    let request = ChatRequest {
        model: "gpt-4o-mini".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "Translate to English if the input is Japanese, or to Japanese if the input is English. Preserve code blocks, URLs, technical terms, and formatting exactly as-is. Only output the translation, nothing else.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: text,
            },
        ],
        stream: true,
        stream_options: StreamOptions {
            include_usage: true,
        },
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
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

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);

        for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if data == "[DONE]" {
                    // Emit usage info before done
                    if let Some(usage) = last_usage {
                        let cost = calculate_cost(usage.prompt_tokens, usage.completion_tokens);
                        let _ = app.emit("translate-usage", UsageInfo {
                            prompt_tokens: usage.prompt_tokens,
                            completion_tokens: usage.completion_tokens,
                            estimated_cost: cost,
                        });
                    }
                    let _ = app.emit("translate-done", ());
                    return Ok(());
                }

                if let Ok(chunk) = serde_json::from_str::<ChatChunk>(data) {
                    // Check for usage in chunk
                    if let Some(usage) = chunk.usage {
                        last_usage = Some(usage);
                    }

                    // Emit content chunks
                    if let Some(choice) = chunk.choices.first() {
                        if let Some(content) = &choice.delta.content {
                            let _ = app.emit("translate-chunk", content.clone());
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit("translate-done", ());
    Ok(())
}
