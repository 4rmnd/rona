# Rona v0.1.1 Release Notes

Rona v0.1.1 addresses visual clipping on YouTube's player layout, improves route transitions between home feeds and video pages, and adds conflict-free keyboard shortcuts.

---

### What Changed in v0.1.1

1. **YouTube Layout Unclipping & GPU Scaling**
   - Overrode YouTube's nested `overflow: hidden` rules on `#player`, `#player-container-outer`, `#player-container-inner`, and `#player-container` that clipped the ambient canvas.
   - Replaced negative canvas padding with hardware-accelerated GPU scaling (`transform: scale(...)`), ensuring smooth rendering at 60 FPS without layout thrashing.
   - Added automatic brightness and saturation adjustment so the glow remains vivid around darker videos without muddy contrast.

2. **Self-Healing Route & Player Attachment**
   - Fixed an SPA navigation race condition where navigating from YouTube Home/feed to a watch page failed to bind to the primary video player.
   - Added a lightweight background watchdog that verifies DOM connectivity and automatically re-binds if YouTube rebuilds the player container during ad transitions or playlist autoplays.

3. **Conflict-Free Keyboard Shortcuts**
   - Added `Alt+R` and `Alt+A` as alternative in-page toggle shortcuts alongside `Alt+Shift+R`.
   - On Windows, `Alt+Shift` triggers the system keyboard layout switcher (IME), which intercepted the keystroke. `Alt+R` bypasses this conflict completely.

4. **Accurate Popup Status Indicators**
   - Fixed ambiguous grey dot status in the extension popup.
   - The status indicator now clearly distinguishes between:
     - **Standby · Ready on Watch** (Cyan) when browsing YouTube home or search feeds.
     - **Active · Adaptive** (Green) while a video is playing.
     - **Paused · Ready** (Amber) when playback is paused.
     - **Disabled** (Grey) when toggled off by the user.

---

### Installation

1. Download `rona-v0.1.1.zip` from the release assets below.
2. Unzip the archive into a local folder.
3. Open your Chromium browser (Chrome, Brave, Edge) and go to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the unzipped directory.
6. Open any YouTube watch page to use Rona.
