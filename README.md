# PerspectiveFix

**PerspectiveFix** is a free, browser-based perspective correction tool. Fix skewed document scans, whiteboard photos, and tilted images instantly, privately, and with no uploads.

- 🌐 **Live Demo:** [GitHub Pages](https://oathanrex.github.io/perspective-fix/)
- 🧰 **More tools:** [perspectivefix.app](https://perspectivefix.app/)
- 📖 **Blog:** [Oathan Rex Blog](https://oathanrex.blogspot.com/)

---

## What is PerspectiveFix?

Straighten and correct perspective distortion in:

- Scanned documents & receipts
- Book pages & study notes
- Whiteboards & presentations
- Architectural & real estate photos
- Posters, signs & product packaging
- Screenshots & screen captures

All processing runs **locally in your browser**, so your images never leave your device.

---

## Features

### Perspective Correction
- Adjust the four document corners by dragging them or nudging a focused corner with the arrow keys
- Use **Auto-Snap** to detect document edges
- Magnified corner view for more precise adjustments
- Reset corners with `R` or rotate the image clockwise with `Q`
- Preview as side-by-side, corner adjustment, scan result, or curtain comparison

### Filters & Export
- Enhancement filters: **Document**, **B&W Ink**, **Whiteboard**, and **Photo**
- Aspect ratio presets: Free Aspect, Long Receipt, A4 Portrait/Landscape, US Letter, 16:9 Presentation, and 1:1 Square
- Export as PNG, JPG, or WebP, or copy the corrected PNG to the clipboard
- Load sample images or restore recent scans from this browser
- Upload, drag and drop, or paste JPG, PNG, WebP, and other browser-supported images

### Privacy & Accessibility
- Image processing runs locally in your browser; images are not uploaded
- Light and dark themes
- Keyboard-operable corner handles and accessible editor controls
- Touch-friendly controls for phones and tablets
- Installable as a Progressive Web App (PWA) on supported browsers
- The app shell and production assets are cached for offline reopening after the first visit

---

## Install the App

Open the [live demo](https://oathanrex.github.io/perspective-fix/) over HTTPS:

- **Desktop:** In Chrome or Edge, use the install icon in the address bar, or open the browser menu and choose **Install PerspectiveFix**.
- **Android:** In Chrome, open the menu and choose **Install app** or **Add to Home screen**.
- **iPhone/iPad:** In Safari, tap **Share**, then **Add to Home Screen**.

The app must be opened online once so the browser can cache its app shell and files. Browser support and menu wording may vary.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` `←` `→` | Nudge a focused corner |
| `Shift` + arrow | Nudge a focused corner by a larger step |
| Hold `Space` | Peek at the original image |
| `R` | Reset / untangle corners |
| `Q` | Rotate image 90° clockwise |
| `Ctrl/Cmd` + `S` | Download the corrected image |
| `Ctrl/Cmd` + `C` | Copy the corrected PNG |
| `Ctrl/Cmd` + `V` | Paste an image from the clipboard |
| `T` | Toggle light / dark theme |
| `?` | Open the shortcuts guide |
| `Esc` | Close the open history or shortcuts panel |

---

## Tech Stack

- React and TypeScript
- Vite and Tailwind CSS
- Browser Canvas APIs for image preview and export
- GitHub Actions and GitHub Pages for deployment

---

## Support

If PerspectiveFix is useful to you, you can support its development:

<a href="https://www.buymeacoffee.com/oathanrex" target="_blank" rel="noopener noreferrer">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" width="217" height="60">
</a>

---

## License

Tool interface and code: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)  
Free for personal and non-commercial use. Attribution required. Unauthorized commercial use is strictly prohibited.

---

## About

Built by [OathanRex](https://github.com/oathanrex), a suite of privacy-first browser tools.
