# Rona

[![Release: v0.1.0](https://img.shields.io/badge/Release-v0.1.0-amber.svg)](https://github.com/4rmnd/rona/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](./public/manifest.json)
[![Tests: 30 passed](https://img.shields.io/badge/Tests-30%20passed-emerald.svg)](./tests/)

Rona is a lightweight browser extension that adds a soft, dynamic ambient glow around YouTube videos on desktop Chrome and Brave.

Most ambient light extensions use unconstrained render loops that put continuous load on your GPU, which can make playback stutter on everyday laptops. Rona is built with an Adaptive Resource Mode that tracks playback stability. If your machine starts dropping frames, Rona lowers internal render quality automatically. When you pause the video, switch tabs, or minimize your window, rendering stops within one second.

---

## What Rona Does

- **Dynamic glow:** Generates ambient lighting behind the player that tracks video colors in real time without blocking player controls, text, or captions.
- **Adaptive resource management:** Automatically steps down internal canvas resolution and frame rate when playback pressure is detected, and recovers quality when the system is stable.
- **Instant shutdown:** Cleans up active render callbacks and canvas memory when video playback pauses or ends.
- **Configurable visuals:** Fine-tune intensity, blur radius, spread, edge fade, and glow direction (all sides, top only, sides only, or bottom only).
- **Keyboard toggle:** Press `Alt + Shift + R` to switch the effect on or off at any time.

---

## Resource Profiles

You can choose between three presets in the popup:

| Profile | Internal Render Size | Target FPS | Best For |
|---|---|---|---|
| **Eco** | 320 × 180 | 15 FPS | Battery saving and low-spec laptops |
| **Balanced** (Default) | 480 × 270 | 24 FPS | Everyday viewing on standard monitors |
| **Cinematic** | 640 × 360 | 30 FPS | Higher visual detail on machines with dedicated GPUs |

Adaptive Resource Mode starts at your selected profile cap. If your browser drops frames, quality scales down. After 30 seconds of stable playback, quality steps back up, never exceeding your chosen profile.

---

## Early Test Numbers

Measured in a clean browser profile during 1080p 24fps video playback:

- **Dropped frames:** 0 frames dropped during testing.
- **GPU memory overhead:** Approximately 9 MB of additional VRAM while rendering.
- **Idle behavior:** Resource usage returns to 0 when paused or hidden.

*Note: Real-world memory and GPU consumption vary depending on your graphics hardware, display resolution, and browser hardware acceleration settings.*

---

## How to Install (Chrome & Brave)

Rona is distributed directly as an open-source build that you can install in seconds using your browser's Developer Mode.

### Option 1: Install from Release ZIP (Recommended)

1. Download **`rona-v0.1.0.zip`** from the [GitHub Releases](https://github.com/4rmnd/rona/releases) page.
2. Unzip the file to a folder on your computer (for example, in your `Downloads` folder).
3. Open your browser and go to the extensions management page:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
4. Turn on the **Developer mode** toggle in the top right corner.
5. Click the **Load unpacked** button in the top left corner.
6. Select the unzipped folder (the one containing `manifest.json`).
7. Open any YouTube video (`https://www.youtube.com/watch?v=...`) to use Rona.

### Option 2: Build from Source

If you prefer building from the TypeScript source code:

```bash
# Clone the repository
git clone https://github.com/4rmnd/rona.git
cd rona

# Install dependencies
npm install

# Build the extension into dist/
npm run build
```

Then go to `chrome://extensions`, click **Load unpacked**, and choose the `dist/` directory.

---

## Shortcuts and Settings

- **Toggle shortcut:** Press `Alt + Shift + R` on any YouTube watch page. To change this shortcut, visit `chrome://extensions/shortcuts` in your browser.
- **Popup menu:** Click the Rona icon in your browser toolbar to toggle the effect, switch profiles, or view the active adaptive tier.
- **Settings page:** Right-click the extension icon and select **Options** (or click Settings in the popup) to customize visual sliders and inspect live render metrics.

---

## Privacy and Permissions

Rona runs entirely on your local machine.

- **No telemetry:** Rona contains no analytics, tracking scripts, crash reporters, or external connections.
- **Zero network requests:** The extension never makes network calls. It does not send video URLs, watch history, or device data anywhere.
- **Scoped permissions:**
  - `storage`: Saves your visual settings and profile preferences locally via `chrome.storage.local`.
  - `commands`: Powers the keyboard toggle shortcut.
  - `*://www.youtube.com/watch*`: Restricts script execution exclusively to YouTube watch pages. Rona does not request access to all websites (`<all_urls>`).

Read [`PRIVACY.md`](./PRIVACY.md) for full details.

---

## Current Limitations

- **Desktop YouTube only:** Optimized specifically for standard desktop YouTube watch pages. It does not run on YouTube Shorts, YouTube Music, embedded third-party players, or mobile browsers.
- **Hardware acceleration:** Requires browser hardware acceleration to be enabled (`chrome://settings/system`) for optimal canvas rendering.

---

## Development

Rona uses TypeScript and is tested with Vitest.

```bash
# Run unit test suite
npm test

# Run tests with coverage report
npm run test:coverage

# Type check
npm run lint

# Package extension zip into release/
npm run package
```

Test guarantees and verification methodology are documented in [`docs/tdd/rona-v1.tdd.md`](./docs/tdd/rona-v1.tdd.md) and [`BENCHMARK.md`](./BENCHMARK.md).

---

## License

MIT License. Free and open source.  
Copyright (c) 2026 Armand Habib Bachtiar.
