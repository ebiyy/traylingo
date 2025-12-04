import { describe, expect, it } from "vitest";
import { formatText, isJapanese } from "./formatText";

describe("isJapanese", () => {
  it("detects hiragana", () => {
    expect(isJapanese("こんにちは")).toBe(true);
  });

  it("detects katakana", () => {
    expect(isJapanese("カタカナ")).toBe(true);
  });

  it("detects kanji", () => {
    expect(isJapanese("漢字")).toBe(true);
  });

  it("returns false for English", () => {
    expect(isJapanese("Hello World")).toBe(false);
  });
});

describe("formatText", () => {
  it("returns empty string unchanged", () => {
    expect(formatText("")).toBe("");
  });

  it("adds line breaks after Japanese periods", () => {
    const input = "これはテストです。次の文です。";
    const expected = "これはテストです。\n次の文です。\n";
    expect(formatText(input)).toBe(expected);
  });

  it("preserves code blocks", () => {
    const input = "説明です。```const x = 1;```続きます。";
    const result = formatText(input);
    expect(result).toContain("```const x = 1;```");
  });

  it("leaves English text unchanged", () => {
    const input = "Hello. World.";
    expect(formatText(input)).toBe("Hello. World.");
  });
});
