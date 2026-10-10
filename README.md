# Rona — Ambient Light for YouTube

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](./public/manifest.json)
[![Tests: 30 passed](https://img.shields.io/badge/Tests-30%20passed-emerald.svg)](./tests/)
[![Coverage: 96%](https://img.shields.io/badge/Coverage-96%25-brightgreen.svg)](./vitest.config.ts)

**Rona** is a privacy-first, resource-aware browser extension that adds a premium ambient-light effect around YouTube videos on desktop Chrome and Brave.

Unlike conventional ambient extensions that burden your CPU/GPU with unconstrained render loops and complicated manual resolution settings, Rona **actively protects playback smoothness by default** using an intelligent **Adaptive Resource Mode** and automatically goes quiet when the effect is not needed.

---

## ✨ Features

- **Cinematic Ambient Glow:** Follows video colors in real-time, surrounding the player cleanly without obstructing controls or captions.
- **Resource-Aware by Default:** `Adaptive Resource Mode` monitors dropped frames and render cost, stepping down resolution and FPS before video playback stutters.
- **Predictable Resource Profiles:**
  - 🌿 **Eco:** 320×180 internal render @ 15 FPS (Ideal for laptops and low-spec machines)
  - ⚖️ **Balanced (Default):** 480×270 internal render @ 24 FPS (Optimal balance of beauty and performance)
  - 🎬 **Cinematic:** 640×360 internal render @ 30 FPS (Maximum visual fidelity)
- **Zero Resource Waste:** Rendering immediately halts and releases callbacks within **1 second** when the video is paused, ended, minimized, or when you switch tabs.
- **Premium Obsidian Popup:** Minimalist dark interface with master toggle, instant profile switcher, and real-time state indicator.
- **Advanced Visual Controls:** Tune Intensity, Blur Radius, Spread, Edge Fade, and Direction (All sides, Top only, Sides only, Bottom only).
- **Honest Diagnostics:** Inspect active adaptive tier, FPS cap, internal render size, and render state without misleading or fake RAM stats.
- **Instant Keyboard Toggle:** Default `Alt+Shift+R` shortcut toggles Rona on any YouTube watch page.
- **100% Privacy-First:** Runs entirely on-device with zero telemetry, zero analytics, zero external network requests, and minimal permissions.

---

## 🚀 Installation Guide (Chrome & Brave)

Rona is distributed as an open-source GitHub release for local installation via **Load unpacked**.

### Method 1: Using the Pre-built Release ZIP (Recommended)

1. Download the latest `rona-v1.0.0.zip` from the [`release/`](./release/) folder or GitHub Releases.
2. Extract `rona-v1.0.0.zip` into a folder on your computer (e.g. `Downloads/rona`).
3. Open your browser and navigate to:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
4. Enable **Developer mode** using the toggle switch in the top-right corner.
5. Click the **Load unpacked** button in the top-left corner.
6. Select the extracted folder containing `manifest.json`.
7. Navigate to any YouTube video watch page (`https://www.youtube.com/watch?v=...`) to enjoy Rona!

---

### Method 2: Building from Source

```bash
# 1. Clone repository
git clone https://github.com/armandhabib/rona.git
cd rona

# 2. Install dependencies
npm install

# 3. Run test suite with coverage
npm run test:coverage

# 4. Build extension into dist/
npm run build

# 5. (Optional) Create release package ZIP
npm run package
```

Then in `chrome://extensions`, click **Load unpacked** and choose the `dist/` folder.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| `Alt + Shift + R` | Toggle Rona ambient effect On / Off | Active YouTube Watch Tab |

> You can customize this shortcut anytime by visiting `chrome://extensions/shortcuts` in your browser.

---

## 🔒 Privacy & Permissions

Rona enforces strict scope discipline under Manifest V3:

- **Host Permissions:** Strictly limited to `*://www.youtube.com/watch*`. Rona will **never** request `<all_urls>` and never runs on non-watch pages.
- **Browser Permissions:** Only `storage` (saving your local visual settings) and `commands` (keyboard toggle).
- **Network Requests:** **Zero.** Rona makes no network calls whatsoever. See [`PRIVACY.md`](./PRIVACY.md) for full details.

---

## 🛠️ Project Architecture

```
rona/
├── src/
│   ├── core/                      # Pure domain logic (100% test-covered)
│   │   ├── adaptive-controller.ts # Adaptive Resource Mode state machine
│   │   ├── capability.ts          # Hardware & Canvas 2D fallback handler
│   │   ├── diagnostics.ts         # Honest metrics formatter
│   │   ├── lifecycle-manager.ts   # Inactive cleanup (1s gate)
│   │   ├── settings.ts            # Schema, profiles & local storage
│   │   └── url-matcher.ts         # Strict YouTube watch URL gating
│   ├── background/                # Background service worker (MV3)
│   │   └── index.ts               # Command listener & message router
│   ├── content/                   # Content script injected into YouTube
│   │   └── index.ts               # Ambient canvas layering & rVFC render loop
│   ├── popup/                     # Obsidian dark extension popup
│   │   ├── index.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── options/                   # Settings & Diagnostics page
│       ├── index.html
│       ├── options.css
│       └── options.ts
├── tests/                         # Vitest TDD test suite
│   ├── adaptive-controller.test.ts
│   ├── capability.test.ts
│   ├── diagnostics.test.ts
│   ├── lifecycle.test.ts
│   ├── settings.test.ts
│   └── url-matcher.test.ts
├── public/
│   ├── manifest.json              # Manifest V3 specification
│   └── icons/                     # Radiant ambient ring icons (16, 48, 128)
├── dist/                          # Compiled extension ready to load unpacked
├── release/                       # Release-ready zip package (rona-v1.0.0.zip)
├── scripts/                       # Build & packaging automation
├── Rona_PRD.md                    # Official Product Requirements Document
├── BENCHMARK.md                   # Benchmark & performance validation protocol
├── PRIVACY.md                     # Privacy policy statement
└── LICENSE                        # MIT License
```

---

## 🧪 Testing & Verification

Rona is developed strictly following **Test-Driven Development (TDD)** and ECC verification loops:

```bash
# Run all unit tests
npm test

# Run tests with coverage threshold report
npm run test:coverage

# Lint TypeScript types
npm run lint
```

Current test metrics:
- **30 / 30 tests passing**
- **96.17% statement coverage**
- **88.88% branch coverage**
- **100% function coverage**

---

## 📄 License

Rona is open-source software licensed under the [MIT License](./LICENSE).  
Copyright (c) 2026 Armand Habib Bachtiar.
