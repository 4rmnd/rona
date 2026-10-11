# Rona — Ambient Light for YouTube (v0.1.0)

[![Release: v0.1.0](https://img.shields.io/badge/Release-v0.1.0-amber.svg)](https://github.com/4rmnd/rona/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](./public/manifest.json)
[![Tests: 30 passed](https://img.shields.io/badge/Tests-30%20passed-emerald.svg)](./tests/)
[![Coverage: 96%](https://img.shields.io/badge/Coverage-96%25-brightgreen.svg)](./vitest.config.ts)

**Rona** adalah ekstensi browser berbasis Manifest V3 yang menghadirkan efek ambient light lembut dan dinamis di sekeliling pemutar video YouTube desktop (Chrome & Brave).

Rona dirancang dengan pendekatan **Adaptive Resource Mode**: efek visual tetap estetik dan menyatu dengan warna video, namun diuji secara ketat agar **tetap ringan saat dipakai** dan tidak mengorbankan kelancaran playback video Anda.

---

## ✨ Fitur Utama

- **Ambient Light Dinamis:** Menghasilkan pendaran warna yang mengikuti ritme video secara real-time di sekeliling pemutar tanpa menutupi video maupun tombol kontrol YouTube.
- **Adaptive Resource Mode:** Secara otomatis memantau stabilitas playback. Jika sistem mendeteksi lonjakan dropped frame atau beban render berlebih, kualitas internal akan diturunkan secara mulus agar video tidak patah-patah.
- **Tiga Profil Resource yang Terukur:**
  - 🌿 **Eco:** Resolusi internal 320×180 @ 15 FPS (Cocok untuk laptop hemat baterai atau spesifikasi dasar).
  - ⚖️ **Balanced (Default):** Resolusi internal 480×270 @ 24 FPS (Keseimbangan optimal antara kualitas visual dan performa).
  - 🎬 **Cinematic:** Resolusi internal 640×360 @ 30 FPS (Fidelity visual tertinggi untuk perangkat bertenaga).
- **Quiet When Inactive (Zero Waste):** Proses rendering segera berhenti total dalam waktu **≤ 1 detik** saat video di-pause, selesai, diminimize, atau saat berpindah tab.
- **Kontrol Visual Lengkap:** Atur Intensity, Blur Radius, Spread, Edge Fade, dan Direction (All sides, Top only, Sides only, Bottom only).
- **Shortcut Praktis:** Cukup tekan `Alt + Shift + R` untuk menyalakan/mematikan efek ambient seketika.
- **Diagnostik Jujur:** Panel diagnostik hanya menampilkan metrik runtime riil (profil, tier adaptif aktif, cap FPS, resolusi render, status render) tanpa mengklaim estimasi RAM sistem yang tidak akurat.

---

## 📊 Hasil Pengujian Awal (Clean Test)

Pada pengujian pengujian bersih (clean profile) dengan video uji **1080p24**:
- **Dropped Frames:** **0 dropped frames** selama pengujian playback (kelancaran video tetap terjaga 100%).
- **GPU Memory Overhead:** Tambahan memori GPU hanya sekitar **~9 MB** saat ambient aktif.
- **Idle / Pause:** Penggunaan resource GPU/CPU langsung kembali ke nol begitu playback dihentikan atau tab disembunyikan.

> *Catatan:* Hasil pengujian di atas diperoleh pada perangkat pengujian referensi. Beban kerja riil dan konsumsi memori dapat berbeda-beda tergantung spesifikasi hardware, resolusi layar, serta driver GPU di masing-masing perangkat.

---

## 🚀 Cara Install via "Load unpacked" (Chrome & Brave)

Rona didistribusikan sebagai rilis open-source GitHub yang dapat dipasang langsung secara lokal:

### Cara 1: Menggunakan Release ZIP (Paling Mudah)

1. Unduh file [**`rona-v0.1.0.zip`**](https://github.com/4rmnd/rona/releases) dari menu [Releases di GitHub](https://github.com/4rmnd/rona/releases) (atau dari folder [`release/`](./release/)).
2. Ekstrak file `rona-v0.1.0.zip` tersebut ke folder di komputer Anda (misalnya di `Downloads/rona-v0.1.0`).
3. Buka browser dan buka halaman ekstensi:
   - **Google Chrome:** ketik `chrome://extensions` di address bar
   - **Brave Browser:** ketik `brave://extensions` di address bar
4. Aktifkan toggle **Developer mode** di pojok kanan atas.
5. Klik tombol **Load unpacked** di pojok kiri atas.
6. Pilih folder hasil ekstrak yang berisi file `manifest.json`.
7. Buka video YouTube apa pun (`https://www.youtube.com/watch?v=...`) dan nikmati efek ambient Rona!

---

### Cara 2: Build dari Source Code

```bash
# 1. Clone repository
git clone https://github.com/4rmnd/rona.git
cd rona

# 2. Install dependencies
npm install

# 3. Jalankan automated test suite
npm run test:coverage

# 4. Build extension ke folder dist/
npm run build

# 5. (Opsional) Buat paket ZIP rilis
npm run package
```

Setelah proses build selesai, buka `chrome://extensions`, klik **Load unpacked**, dan pilih folder `dist/`.

---

## 🔒 Izin Ekstensi & Privasi Lokal

Rona memegang teguh prinsip **100% on-device & zero-telemetry**:

| Izin (Permission) | Mengapa Dibutuhkan? |
|---|---|
| `storage` | Digunakan secara eksklusif untuk menyimpan preferensi visual Anda (slider, profil aktif, toggle adaptif) secara lokal di browser (`chrome.storage.local`). Pengaturan ini **tidak pernah keluar** dari komputer Anda. |
| `commands` | Mendukung shortcut keyboard `Alt + Shift + R` untuk toggle efek secara cepat. |
| `*://www.youtube.com/watch*` (Host Permission) | Dibatasi ketat **hanya** pada halaman tonton video YouTube resmi. Rona tidak pernah meminta izin `<all_urls>` dan tidak aktif di situs web lain. |

**Jaminan Privasi:**
- Tidak ada analitik, tracking, crash reporter, atau sinkronisasi cloud.
- Nol request jaringan (`fetch`, `XMLHttpRequest`, atau `WebSocket` tidak pernah dipanggil).
- Pemrosesan piksel kanvas dilakukan secara lokal dan sementara (ephemeral) hanya untuk menghitung warna ambient frame yang sedang tayang.

---

## ⚠️ Batasan Rilis Saat Ini (v0.1.0)

- **Hanya YouTube Desktop:** Saat ini baru dioptimalkan untuk halaman tonton standar YouTube desktop (`https://www.youtube.com/watch*`). Belum mendukung YouTube Shorts, YouTube Music, pemutar embed luar, maupun browser mobile.
- **Variasi Perangkat:** Efisiensi rendering sangat bergantung pada akselerasi hardware browser Anda. Pastikan opsi *Hardware Acceleration* aktif di pengaturan browser Anda (`chrome://settings/system`).

---

## ⌨️ Shortcut Keyboard

- **Toggle Efek:** `Alt + Shift + R`
- Untuk mengubah kombinasi tombol shortcut, buka `chrome://extensions/shortcuts` di browser Anda.

---

## 🛠️ Testing & Validasi Teknis

```bash
npm test              # Menjalankan 30 unit tests
npm run test:coverage # Menampilkan laporan coverage v8 (96%+)
npm run lint          # Validasi tipe TypeScript (0 error)
```

- **Tests:** 30 / 30 passed
- **Coverage:** 96.17% statements, 88.88% branches, 100% functions
- **Detail Pengujian:** Lihat [`docs/tdd/rona-v1.tdd.md`](./docs/tdd/rona-v1.tdd.md) dan [`BENCHMARK.md`](./BENCHMARK.md).

---

## 📄 Lisensi

Rona adalah perangkat lunak sumber terbuka (open-source) di bawah lisensi [MIT License](./LICENSE).  
Copyright (c) 2026 Armand Habib Bachtiar.
