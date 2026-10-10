# Benchmark & Validation Protocol — Rona

This document outlines the benchmark procedures and verification gates for **Rona v1.0**, as specified in Section 3 and Section 10 of [`Rona_PRD.md`](./Rona_PRD.md).

---

## 1. Release Performance Gates

| Metric | Target | Verification Method |
|---|---|---|
| **Effect Availability** | Ambient effect appears within **≤ 2 seconds** after video is ready. | Manual test on the 5-page test matrix. |
| **Playback Impact** | Added dropped-frame rate **≤ 1.0 percentage point** above baseline without Rona over 10 minutes (1080p60 test video in Balanced mode). | YouTube *Stats for Nerds* comparison in a clean profile. |
| **Adaptive Response** | Downgrades 1 quality tier within **≤ 3 seconds** when dropped frames spike; recovers 1 tier only after **≥ 30 seconds** of stability. | Deterministic test hook & stress testing. |
| **Inactive Cleanup** | Rendering stops within **≤ 1 second** of pause, video end, hidden tab, or SPA navigation. No active callbacks remain. | DevTools timeline & automated lifecycle tests. |
| **Resource Leak Prevention** | Zero unbounded growth in GPU textures, buffers, or frame callbacks during a 30-minute soak test. | Chrome Task Manager & DevTools Memory audit. |
| **Privacy Compliance** | Zero network calls made by Rona. | Network panel audit (0 requests filtered by extension ID). |

---

## 2. Test Hardware Specifications

- **Reference Device:** Lenovo LOQ IRX9, Intel i7-13645HX, 16 GB RAM, NVIDIA RTX 4050 Laptop GPU, Brave / Chrome stable.
- **Stress-Test Device:** ASUS VivoBook X412DA, AMD Ryzen 5 5300U, Vega 8, 4 GB RAM. (Informs Eco-mode throttling).

---

## 3. Five-Page Validation Matrix

1. **Standard 16:9 1080p Video:** Verify smooth glow synchronization and positioning.
2. **Music Video / High Contrast:** Verify rapid color transitions and spread visual polish.
3. **4K60 Ultra-HD Video:** Verify Adaptive Resource Mode cap and dropped-frame stability.
4. **Ad Transition:** Verify that ambient glow gracefully handles ad breaks without breaking layout or player controls.
5. **SPA Navigation (Video A → Video B):** Verify cleanup of old video renderer, detachment of callbacks, and re-attachment to new video.

---

## 4. Benchmark Execution Procedure

### Step 1: Baseline (Without Extension)
1. Open Chrome/Brave in an Incognito / clean profile with hardware acceleration enabled.
2. Navigate to test video `https://www.youtube.com/watch?v=...` (1080p60).
3. Right-click video and select **Stats for Nerds**.
4. Play for 10 minutes.
5. Record total frames and dropped frames:
   $$\text{Dropped Frame Rate Baseline} = \frac{\text{Dropped Frames}}{\text{Total Frames}} \times 100\%$$

### Step 2: With Rona (Balanced Profile)
1. Load unpacked extension from `dist/`.
2. Open the same test video in the same conditions.
3. Play for 10 minutes in default Balanced mode.
4. Record total frames and dropped frames from **Stats for Nerds**:
   $$\text{Dropped Frame Rate Rona} = \frac{\text{Dropped Frames}}{\text{Total Frames}} \times 100\%$$
5. Verify gate:
   $$\text{Delta} = \text{Dropped Frame Rate Rona} - \text{Dropped Frame Rate Baseline} \le 1.0\%$$

### Step 3: Lifecycle Cleanup Verification
1. Open DevTools `Performance` / `Rendering` tab.
2. Press Spacebar to pause video.
3. Verify that within 1 second, canvas drawing stops and frame rate drops to 0.
4. Switch to another tab for 10 seconds; inspect Chrome Task Manager to confirm extension process CPU usage is 0.0%.
