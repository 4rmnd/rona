# Rona v0.1.0 — Initial Release

Rona adalah ekstensi browser open-source (Manifest V3) yang menghadirkan efek ambient light lembut di sekitar pemutar video YouTube desktop (Chrome & Brave).

Rona dibuat dengan fokus utama pada stabilitas: visual tetap estetik dan sinematik, namun diuji secara ketat agar **tetap ringan saat dipakai** melalui **Adaptive Resource Mode**.

---

## 📦 Download & Instalasi (Load unpacked)

1. Unduh asset **`rona-v0.1.0.zip`** di bawah ini.
2. Ekstrak file zip tersebut ke folder komputer Anda (misal `Downloads/rona-v0.1.0`).
3. Buka browser:
   - **Chrome:** `chrome://extensions`
   - **Brave:** `brave://extensions`
4. Aktifkan **Developer mode** di pojok kanan atas.
5. Klik **Load unpacked** dan pilih folder hasil ekstrak yang berisi `manifest.json`.
6. Buka video YouTube apa pun (`https://www.youtube.com/watch*`) dan nikmati efek ambient Rona!

---

## ✨ Fitur v0.1.0

- **Dynamic Ambient Light:** Mengikuti warna video secara langsung tanpa menutupi kontrol atau teks video.
- **Adaptive Resource Mode:** Memantau dropped frame dan render overhead secara otomatis, menurunkan kualitas jika sistem terbebani dan memulihkannya saat stabil.
- **Tiga Pilihan Profil Resource:**
  - 🌿 **Eco:** 320×180 internal render @ 15 FPS
  - ⚖️ **Balanced (Default):** 480×270 internal render @ 24 FPS
  - 🎬 **Cinematic:** 640×360 internal render @ 30 FPS
- **Quiet When Inactive:** Berhenti merender dan membebaskan resource dalam ≤1 detik saat video di-pause, selesai, atau tab disembunyikan.
- **Shortcut Keyboard:** `Alt + Shift + R` untuk on/off seketika.
- **Pengaturan Visual:** Kustomisasi Intensity, Blur Radius, Spread, Edge Fade, dan Direction di menu Settings.
- **Panel Diagnostik Jujur:** Menampilkan metrik operasional riil (profil, tier, FPS cap, resolusi, status) tanpa menebak RAM sistem.

---

## 📊 Hasil Pengujian Awal (Clean Test)

- Uji playback pada **1080p24**: **0 dropped frame** (playback mulus 100%).
- Overhead memori GPU (VRAM): Hanya sekitar **~9 MB** saat ambient aktif.
- Resource idle: Kembali ke 0% saat video tidak berputar.

---

## 🔒 Privasi & Keamanan (100% On-Device)

- **Zero Telemetry:** Tidak ada analitik, tracker, iklan, atau server luar.
- **Izin Minimalis:** Hanya `storage` (preferensi lokal) dan `commands` (shortcut).
- **Host Permission Terbatas:** Hanya `*://www.youtube.com/watch*`. Rona tidak pernah meminta `<all_urls>`.

---

## ⚠️ Batasan v0.1.0 & Umpan Balik

- Saat ini baru mendukung **YouTube desktop watch page**. Belum mendukung YouTube Shorts, Music, embeds, maupun browser mobile.
- Hasil performa bisa berbeda antar perangkat dan spesifikasi hardware.
- Kami mengundang 1–2 rekan penguji untuk mencoba di perangkat/laptop berbeda guna memeriksa kompatibilitas dan melaporkan isu melalui [GitHub Issues](https://github.com/4rmnd/rona/issues).
