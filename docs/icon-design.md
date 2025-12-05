# TrayLingo Icon Design

## Concept

**TrayLingo** = Tray + Lingo (sounds like "ringo" = apple in Japanese)
- **Tray**: System tray / menu bar tray area
- **Lingo**: Slang for "language" or "jargon"
- In Japanese, "lingo" sounds like "ringo" (林檎 = apple) → Apple motif

**Vibe**: Lightweight mini-tool feel, casual, approachable

## Design Elements

### 1. Background (Tray)
- macOS-style rounded square (squircle)
- Off-white (#FAF8F6) - harmonizes with warm colors
- Emboss effect for depth (tray feel)
  - Drop shadow
  - Gradient border (top-left: white → bottom-right: gray)
  - Top highlight, bottom inner shadow

### 2. Apple (Ringo)
- Cross-section view, cut in half, facing front
- **Skin**: Wine red (#8B2942)
- **Flesh**: Pink (#FFE8E5) - single color, simple
- **Stem**: Brown (#5D4037)
- **Leaf**: Olive green (#6B8E23)

### 3. Typography
- **"A"**: Wine red (#8B2942), Arial Bold, 260px
- **"あ"**: Salmon (#E8847C), Hiragino Sans Bold, 230px
- Two colors represent bidirectional translation
- Large enough to be readable at small sizes

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Wine Red | #8B2942 | Skin, "A" |
| Salmon | #E8847C | "あ" |
| Pink (flesh) | #FFE8E5 | Flesh |
| Off-white | #FAF8F6 | Background |
| Brown | #5D4037 | Stem |
| Olive Green | #6B8E23 | Leaf |

## Design Decisions

### Why apple cross-section?
- Visualizes "ringo" from the name
- Cross-section = seeing inside = translation reveals "meaning"
- Simple and recognizable at small sizes

### Why emboss on background?
- Represents "Tray" (serving tray / system tray)
- Matches macOS icon depth style
- Not too flat, not too rich

### Why two colors for text?
- Translation = two languages
- Wine red (A) → Salmon (あ) gradient-like transformation

## File Structure

```
src-tauri/icons/
├── traylingo-icon.svg    # Source SVG for app icon (edit this)
├── trayTemplate.svg      # Source SVG for menu bar icon
├── trayTemplate.png      # Menu bar icon 22x22
├── trayTemplate@2x.png   # Menu bar icon 44x44
├── icon.png              # Generated from SVG
├── icon.icns             # macOS app icon
├── icon.ico              # Windows app icon
├── 32x32.png
├── 128x128.png
└── 128x128@2x.png
```

## Regenerating Icons

1. Edit `traylingo-icon.svg`
2. Convert to PNG (requires librsvg):
   ```bash
   cd src-tauri/icons
   rsvg-convert -w 1024 -h 1024 traylingo-icon.svg -o icon-1024.png
   ```
3. Generate all sizes:
   ```bash
   pnpm tauri icon src-tauri/icons/icon-1024.png
   ```

**Note**: Use `rsvg-convert` (not ImageMagick) for accurate font/filter rendering.

## Menu Bar Icon

The menu bar uses `trayTemplate.svg` with the following design:
- **White filled apple** with text cut out (transparent)
- Text "A" and "あ" appear as negative space
- Works on dark menu bar backgrounds

### Regenerating Menu Bar Icon

```bash
cd src-tauri/icons
rsvg-convert -w 22 -h 22 trayTemplate.svg -o trayTemplate.png
rsvg-convert -w 44 -h 44 trayTemplate.svg -o trayTemplate@2x.png
```

### Design Notes
- White fill ensures visibility on dark menu bars
- Text as cutout (mask) creates clean negative space effect
- Simplified apple outline (no emboss) for small size clarity

## AI Prompt Reference (Recraft AI)

If regenerating with AI, use prompts focusing on **shape/form**, not function:

```
Apple cross-section icon. Circular shape with wine red to salmon pink
radial gradient from edge to center. Flat design, minimal, rounded soft
edges. White background.
```

Key learnings:
- AI struggles with dot-art text ("あ" "A" made of seeds didn't work)
- Keep it simple, add text manually in SVG/Figma
- Focus on the apple shape, not translation concept
