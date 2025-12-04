# TrayLingo Codebase Structure

## Root Directory
```
traylingo/
├── src/                    # Frontend (Solid.js + TypeScript)
├── src-tauri/              # Backend (Rust + Tauri)
├── docs/                   # Documentation
├── .github/                # GitHub Actions & templates
├── .claude/                # Claude Code configuration
├── .serena/                # Serena MCP (memories/ committed, project.yml gitignored)
├── .vscode/                # VSCode settings
└── node_modules/           # Node dependencies
```

## Frontend (src/)
```
src/
├── App.tsx         # Main UI component
│                   # Symbols: parts, isJapanese, formattedTranslation,
│                   #          copyTranslation, text[0], text[1]
├── index.tsx       # Application entry point
└── index.css       # Tailwind CSS styles
```

## Backend (src-tauri/)
```
src-tauri/
├── src/
│   ├── main.rs     # Rust entry point
│   ├── lib.rs      # Tauri app setup & commands
│   │               # Modules: openai, macos
│   │               # Functions: translate, toggle_window,
│   │               #            show_window, hide_window, run
│   └── openai.rs   # OpenAI API integration
│                   # Structs: ChatRequest, StreamOptions, Message,
│                   #          ChatChunk, Choice, Delta, Usage, UsageInfo
│                   # Functions: calculate_cost, translate_stream
│                   # Constants: INPUT_PRICE_PER_MILLION, OUTPUT_PRICE_PER_MILLION
├── Cargo.toml      # Rust dependencies
└── tauri.conf.json # Tauri configuration
```

## Configuration Files
```
Root files:
├── package.json        # Node dependencies & scripts
├── pnpm-lock.yaml      # Locked dependency versions
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite bundler configuration
├── index.html          # HTML entry point
├── mise.toml           # mise runtime manager config
├── .env                # Environment variables (API keys)
├── .env.example        # Environment template
└── .gitignore          # Git ignore patterns
```

## Documentation
```
docs/
└── screenshot.png      # Application screenshot

Root docs:
├── README.md           # Project overview
├── CONTRIBUTING.md     # Contribution guide
├── SECURITY.md         # Security policy
├── CODE_OF_CONDUCT.md  # Community guidelines
├── LICENSE             # MIT license
├── TODO.md             # Task tracking
└── CLAUDE.md           # Claude Code instructions
```

## Key Architecture Points

### Communication Flow
1. User presses `Cmd+J`
2. Frontend receives global shortcut event
3. Clipboard content read via Tauri plugin
4. `translate` command called to backend
5. Backend streams response from OpenAI
6. Frontend displays streaming translation
7. Token usage tracked and displayed

### Tauri Plugins Used
- `tauri-plugin-global-shortcut` - Global keyboard shortcuts
- `tauri-plugin-clipboard-manager` - Clipboard access
- `tauri-plugin-notification` - System notifications
- `tauri-plugin-log` - Logging

### macOS Specific
- System tray (NSStatusItem) integration
- Dock hiding/showing
- objc2 bindings for native APIs
