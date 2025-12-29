---
name: tdd
description: Test-Driven Development workflow guide. TODO - This skill is a placeholder for future development. Will cover TDD patterns for Rust, TypeScript, and Tauri apps.
---

# TDD (Test-Driven Development)

**Status: Placeholder**

This skill will be developed to cover:

## Planned Topics

- [ ] Red-Green-Refactor cycle
- [ ] Rust unit testing patterns (`#[cfg(test)]`)
- [ ] TypeScript/Vitest patterns
- [ ] Tauri command testing strategies
- [ ] When to mock vs integration test
- [ ] Test coverage goals

## Current Testing in TrayLingo

| Type | Location | Framework |
|------|----------|-----------|
| Rust unit | `src-tauri/src/*.rs` | cargo test |
| Frontend | `src/**/*.test.ts` | Vitest |

## Commands

```bash
pnpm test          # Frontend
pnpm test:rust     # Backend
pnpm test:all      # Both
```
