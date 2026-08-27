# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

VRChat avatar creators who want to add animated clocks or sprite-based flipbook animations to their avatar outfits (watches, displays, accessories). They need a simple browser-based tool that generates ready-to-import shader files and texture atlases without requiring Unity or shader programming knowledge.

## Product Purpose

Make it trivially easy for VRChat avatar creators to generate custom watch/flipbook shaders and texture atlases. The user configures dimensions, colors, fonts, and animation settings in the browser, downloads a pre-configured shader and atlas PNG, and imports them directly into Unity for their VRChat avatar. Success means a creator with no shader knowledge can have a working animated clock or sprite display on their avatar.

## Positioning

The only open-source, zero-install browser tool that generates both clock digit shaders and flipbook animation shaders for VRChat avatars in one place. Competing approaches require manual shader configuration, paid tools, or separate tools for clock vs. animation use cases.

## Operating Context

1. Creator opens the tool in a browser (GitHub Pages)
2. Chooses Clock mode or Flipbook mode
3. Configures visual settings (dimensions, colors, fonts, outline)
4. For Flipbook: uploads individual frames or a sprite sheet, arranges order, sets FPS/loop/ping-pong
5. Previews the result live in browser
6. Downloads atlas PNG and pre-configured .shader file
7. Imports both into Unity material on their VRChat avatar
8. Shader is pre-configured with correct texture path (`VRChat/VRCOpenWatch`) and all parameters set

## Capabilities and Constraints

### Clock Mode
- Generates atlas with 15 fixed digit cells: 0-9, colon, A, P, M, blank
- Configurable cell dimensions, font (built-in + custom upload), colors, outline, position offsets
- Live clock preview in browser
- Pre-configured shader with `_Format`, `_OffsetX`, `_OffsetY`, `_Stroke`, `_StrokeColor`, `_StrokeWidth` properties

### Flipbook Mode
- Individual frame upload (drag & drop, click, multiple files) or sprite sheet upload with grid slicing
- Frame strip with drag reorder and delete
- Configurable grid columns, FPS (1-60), loop, ping-pong
- Live animation preview
- Pre-configured shader with `_FrameCount`, `_FPS`, `_Loop`, `_PingPong` properties
- UV mapping: `(frame + localX) / totalFrames`

### Technical Constraints
- Single HTML file (index.html), no build step, no dependencies
- Atlas max 2048px wide (VRChat texture limit)
- ~120 frames practical max for flipbook
- Shader path hardcoded to `VRChat/VRCOpenWatch`
- All shader parameters baked into downloaded .shader file
- Responsive: desktop and mobile browser support

### i18n
- Three languages: English (default), Japanese, Spanish
- 62 translation keys per language
- HTML `data-i18n` attributes + JS translation object

## Brand Commitments

No special constraints beyond MIT license. Project name is "VRCOpenWatch". Open source, community-driven.

## Evidence on Hand

- `index.html` — complete working tool (~2111 lines)
- `video/demo.mp4` — demo video (6.6MB)
- `LICENSE` — MIT, copyright 2026 VRCOpenWatch Contributors
- GitHub repo: `https://github.com/Artbyo3/VRCOpenWatch`
- GitHub Pages deployment from `main` branch root

## Product Principles

1. **Zero-friction entry** — No installation, no build steps, no account required. Open browser, configure, download.
2. **Shader knowledge optional** — The tool handles all shader logic; the user only makes visual choices.
3. **Open and transparent** — Fully open source, MIT licensed, community-verifiable.
4. **Both modes, one tool** — Clock and Flipbook in a single interface, not separate tools.
5. **Works where you deploy** — Generated assets import directly into Unity with no manual shader editing.

## Accessibility & Inclusion

i18n support for English, Japanese, and Spanish users. Responsive layout for desktop and mobile browsers. Standard form controls with keyboard navigation support.
