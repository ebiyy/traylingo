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
├── App.tsx                 # Main UI component
├── index.tsx               # Application entry point
├── index.css               # Tailwind CSS styles
├── components/
│   ├── Settings.tsx        # Settings panel component
│   ├── PopupView.tsx       # Quick popup view component
│   └── ErrorDisplay.tsx    # Error display component
├── types/
│   ├── error.ts            # Error type definitions
│   └── logging.ts          # Logging types (LogLevel, LogScope, LogEntry)
└── utils/
    ├── formatText.ts       # Text formatting utilities (isJapanese, etc.)
    ├── formatText.test.ts  # Tests for formatText utilities
    └── logger.ts           # Unified logging utility (Logger.info/warn/error)
```

## Backend (src-tauri/)
```
src-tauri/
├── src/
│   ├── main.rs         # Rust entry point
│   ├── lib.rs          # Tauri app setup & commands
│   │                   # Modules: anthropic, macos, settings, error, keychain
│   │                   # Functions: translate, toggle_window, show_window, hide_window,
│   │                   #            show_popup, hide_popup, quick_translate, close_popup,
│   │                   #            get_api_key, set_api_key, has_api_key,
│   │                   #            get_error_history, clear_error_history,
│   │                   #            clear_translation_cache, check_for_updates,
│   │                   #            open_external_url, app_log, run
│   │                   # macOS module: save_frontmost_app, restore_frontmost_app
│   ├── anthropic.rs    # Anthropic Claude API integration
│   │                   # Structs: MessageRequest, Message, StreamEvent,
│   │                   #          ContentDelta, Usage, NonStreamResponse, etc.
│   │                   # Functions: calculate_cost, translate_stream
│   ├── keychain.rs     # macOS Keychain integration for API key storage
│   │                   # Functions: get_api_key, set_api_key, delete_api_key, has_api_key
│   ├── settings.rs     # Settings & cache management
│   │                   # Functions: get_settings, save_settings, get_model_pricing,
│   │                   #            save_error, get_error_history, clear_error_history,
│   │                   #            get_cached_translation, save_cached_translation,
│   │                   #            get_cache_stats, clear_translation_cache,
│   │                   #            mask_sensitive_patterns (PII protection)
│   │                   # Supported models: claude-haiku-4-5, claude-sonnet-4-5
│   └── error.rs        # Error handling types
├── Cargo.toml          # Rust dependencies
└── tauri.conf.json     # Tauri configuration
```

## Configuration Files
```
Root files:
├── package.json        # Node dependencies & scripts
├── pnpm-lock.yaml      # Locked dependency versions
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite bundler configuration
├── vitest.config.ts    # Vitest test configuration
├── biome.json          # Biome linter/formatter config
├── index.html          # HTML entry point
├── mise.toml           # mise runtime manager config
└── .gitignore          # Git ignore rules
```

## Documentation
```
docs/
├── architecture.md     # High-level architecture overview
├── error-management.md # Error handling strategy
├── logging.md          # Unified logging layer documentation
├── auto-updater.md     # Auto-update via GitHub Releases
├── screenshot.png      # Application screenshot
└── screenshot-popup.png # Quick popup screenshot

Root docs:
├── README.md           # Project overview
├── CONTRIBUTING.md     # Contribution guide
├── SECURITY.md         # Security policy
├── CODE_OF_CONDUCT.md  # Community guidelines
├── LICENSE             # MIT license
├── ROADMAP.md          # Roadmap & GitHub Issues tracking
├── CHANGELOG.md        # Version changelog
└── CLAUDE.md           # Claude Code instructions
```

## Key Architecture Points

### Communication Flow
1. User presses `⌘J` (main window) or `⌃⌥J` (quick popup)
2. Frontend receives global shortcut event
3. Clipboard content read via Tauri plugin
4. `translate` command called to backend
5. Backend streams response from Anthropic Claude API
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
- Focus management (NSWorkspace, NSRunningApplication)
  - Saves frontmost app before showing popup
  - Restores focus when popup is hidden
- objc2/objc2-app-kit bindings for native APIs
