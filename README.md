# PerspectiveFix

**PerspectiveFix** is a free, browser-based perspective correction tool. Fix skewed document scans, whiteboard photos, and tilted images — instantly, privately, with no uploads.

🌐 **Live Tool:** [https://perspectivefix.app/](https://perspectivefix.app/)  
📖 **Blog:** [perspectivefix.app/blog](https://perspectivefix.app/blog/index.html)

---

## What is PerspectiveFix?

Straighten and correct perspective distortion in:

- Scanned documents & receipts
- Book pages & study notes
- Whiteboards & presentations
- Architectural & real estate photos
- Posters, signs & product packaging
- Screenshots & screen captures

All processing runs **locally in your browser** — your images never leave your device.

---

## Features

### Core Correction
- 4-corner drag-based perspective warp with real-time preview
- Zoom lens — 3× magnified view while placing corners for pixel-perfect accuracy
- Alignment grid overlay (toggle with `G`) for straightening reference
- Corner reset (`R`) returns all four points to default positions
- 90° image rotation (`Q`) before correcting

### Output Control
- **Aspect ratio presets:** Auto (from corners), Square 1:1, A4 Portrait & Landscape, US Letter Portrait & Landscape
- **Custom ratio:** enter any W:H ratio manually
- **Exact pixel size:** set output to a specific width × height in pixels
- **Export formats:** PNG (lossless), JPG, WebP, PDF (single-page document)
- **Quality slider:** 1–100 control for JPG and WebP exports

### Image Adjustments
- Brightness (−100 to +100)
- Contrast (−100 to +100)
- Sharpen (0 to 100)
- Warmth (−100 to +100)
- Grayscale toggle
- Negative / invert toggle

### Document Enhance
- **Magic Color mode** — cleans background, boosts contrast for document scans
- **Deep Ink mode** — high-contrast black-and-white output for handwritten notes and receipts
- Adjustable enhance strength slider

### History & Workflow
- Full undo/redo stack for corner adjustments
- Keyboard shortcuts: `Ctrl+Z` undo, `Ctrl+Y` redo, `Ctrl+S` download
- Paste image directly from clipboard with `Ctrl+V`
- Supports JPG, PNG, WebP input (drag & drop, file picker, or clipboard paste)

### Accessibility & UX
- Light / Dark theme toggle (respects system preference on first load)
- Full keyboard navigation for corner handles (arrow keys)
- ARIA labels and live region announcements throughout
- `prefers-reduced-motion` respected for animations
- Touch-friendly on Android and iPhone — no app install needed
- Sticky header with blur-backdrop for one-handed mobile use

### Performance
- OffscreenCanvas + ImageBitmap used where supported for faster rendering
- Zero external dependencies — pure vanilla HTML, CSS, JavaScript
- Works offline after first page load (PWA manifest included)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Reset corners |
| `Q` | Rotate image 90° |
| `F` | Toggle image adjustments panel |
| `E` | Toggle Document Enhance panel |
| `G` | Toggle alignment grid |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Download corrected image |
| `Ctrl+V` | Paste image from clipboard |

---

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript — zero dependencies
- Canvas API & OffscreenCanvas for image processing
- CSS custom properties with full dark/light theme system
- PWA manifest for offline capability
- Cloudflare Pages (production hosting at perspectivefix.app)

---

## Version

Current release: **v2.1.0** (PerspectiveFix Pro)

---

## License

Tool interface and code: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)  
Free for personal and non-commercial use. Attribution required. Unauthorized commercial use is strictly prohibited.

---

## About

Built by [OathanRex](https://github.com/oathanrex) — a suite of zero-dependency, privacy-first browser tools.  
[☕ Support this project](https://www.buymeacoffee.com/oathanrex)
