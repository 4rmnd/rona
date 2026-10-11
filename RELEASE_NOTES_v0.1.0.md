# Rona v0.1.0 — Initial Release

Rona is an open-source browser extension (Manifest V3) that brings dynamic ambient lighting around desktop YouTube videos on Chrome and Brave.

Unlike conventional ambient light extensions that run unconstrained render loops, Rona features an **Adaptive Resource Mode** designed to keep playback smooth and lightweight on everyday machines.

---

## Download & Installation (Load unpacked)

1. Download **`rona-v0.1.0.zip`** from the assets below.
2. Unzip the file to a folder on your computer (for example, in your `Downloads` folder).
3. Open your browser's extensions page:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
4. Turn on the **Developer mode** toggle in the top right corner.
5. Click **Load unpacked** and select the unzipped folder containing `manifest.json`.
6. Open any YouTube video (`https://www.youtube.com/watch?v=...`) to use Rona.

---

## Key Features

- **Dynamic glow:** Generates ambient lighting behind the player that follows video colors in real time without obstructing player controls or captions.
- **Adaptive Resource Mode:** Monitors dropped frames and render overhead, stepping down internal resolution and FPS if your machine is under load, and recovering quality when stable.
- **Three resource profiles:**
  - **Eco:** 320 × 180 internal render @ 15 FPS
  - **Balanced (Default):** 480 × 270 internal render @ 24 FPS
  - **Cinematic:** 640 × 360 internal render @ 30 FPS
- **Quiet when inactive:** Halts rendering and clears canvas memory within 1 second when video playback is paused, ended, minimized, or backgrounded.
- **Instant shortcut:** Press `Alt + Shift + R` to toggle the effect on or off.
- **Visual sliders:** Tweak intensity, blur radius, spread, edge fade, and glow direction in Settings.
- **Honest diagnostics:** Displays live operational metrics (profile, active tier, FPS cap, render size, status) without guessed or fake RAM numbers.

---

## Early Test Numbers (Clean Profile)

- **1080p 24fps test playback:** 0 dropped frames during active playback.
- **GPU memory overhead:** Approximately 9 MB of additional VRAM while rendering.
- **Idle state:** 0% added load when paused or tab is hidden.

---

## Privacy & Permissions (100% On-Device)

- **No telemetry:** Zero analytics, tracking scripts, crash reporters, or external connections.
- **Scoped permissions:** Only `storage` (local preferences) and `commands` (keyboard toggle).
- **Restricted host permissions:** Strictly limited to `*://www.youtube.com/watch*`. Rona never requests `<all_urls>`.

---

## Current Scope & Feedback

- Currently optimized for desktop YouTube watch pages. YouTube Shorts, YouTube Music, embedded third-party players, and mobile browsers are not supported.
- Hardware performance depends on your specific GPU and browser hardware acceleration settings.
- If you run into issues or bugs on different hardware configurations, please let us know via [GitHub Issues](https://github.com/4rmnd/rona/issues).
