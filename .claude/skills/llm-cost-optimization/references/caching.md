# LLM Caching Strategies

## Anthropic Prompt Caching

### How It Works

Cache system prompts for 90% discount on subsequent calls (within 5-minute TTL).

### Implementation

```rust
// Before: Simple string
struct MessageRequest {
    system: String,  // Full price every time
}

// After: Cacheable block
struct SystemBlock {
    #[serde(rename = "type")]
    block_type: String,  // "text"
    text: String,
    cache_control: CacheControl,  // "ephemeral"
}

struct MessageRequest {
    system: Vec<SystemBlock>,  // Cached after first call
}
```

### Cost Calculation

For short text (80% system prompt):
```
Before: $0.00043/call
After:  $0.00043 × (0.2 + 0.8 × 0.1) = $0.00012/call
Savings: ~72% (continuous use)
```

Real-world with cache misses: **25-45% savings**

## Local Response Cache

### Design

```rust
struct CachedTranslation {
    source_hash: String,      // SHA256 of input
    source_preview: String,   // First 100 chars (debug)
    translated_text: String,
    model: String,            // Critical: different models = different results
    timestamp: i64,
}
```

### Implementation

```rust
use sha2::{Sha256, Digest};

fn cache_key(text: &str, model: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    hasher.update(model.as_bytes());
    format!("{:x}", hasher.finalize())
}

// Before API call
if let Some(cached) = cache.find(|e| e.source_hash == key) {
    info!("Cache hit ({} chars)", text.len());
    return Ok(cached.translated_text);
}

// After API call
cache.push(CachedTranslation {
    source_hash: key,
    translated_text: result.clone(),
    model: model.to_string(),
    timestamp: now(),
    ..
});
```

### Cache Management

| Setting | Value | Reason |
|---------|-------|--------|
| Max entries | 500 | Memory limit |
| Eviction | LRU | Keep frequently used |
| Model in key | Yes | Different models, different results |

### Savings

- Cache hit: **100% savings** (zero API cost)
- "Second time free"

## UI Feedback

Show users when cache is used:

```typescript
<Show when={usage()?.cached}>
  <span class="text-success">Cached</span>
  <span class="text-accent">$0.00</span>
</Show>
```

Builds cost awareness and trust.

## Combined Effect

| Technique | Individual | Combined |
|-----------|------------|----------|
| Prompt Caching | 25-45% | |
| Response Cache | 100% (on hit) | |
| **Total** | | **35-65%** |

## Cache Invalidation

When to invalidate:
- Model change (new key)
- System prompt change (Prompt Cache TTL handles)
- User clears manually

What NOT to invalidate on:
- App restart (persist to disk)
- Minor setting changes (unless relevant)
