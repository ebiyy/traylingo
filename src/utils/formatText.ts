// Detect if Japanese (hiragana, katakana, or kanji)
export function isJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// Format text based on detected language, preserving code blocks
export function formatText(text: string): string {
  if (!text) return text;

  // Split by code blocks to preserve them
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part) => {
      // Don't modify code blocks
      if (part.startsWith("```")) {
        return part;
      }

      if (isJapanese(part)) {
        // Add line breaks after Japanese periods for readability
        return part.replace(/。(?![\n」』）])/g, "。\n").replace(/\n{3,}/g, "\n\n");
      }

      // English: preserve existing formatting
      return part;
    })
    .join("");
}
