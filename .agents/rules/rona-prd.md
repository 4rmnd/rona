# Rona Extension — PRD Operational Rules & Guardrails

Dokumen ini mendefinisikan aturan operasional, batasan teknis (guardrails), dan kontrak eksekusi untuk pengembangan ekstensi browser **Rona (v1.0)** berdasarkan spesifikasi resmi pada [`Rona_PRD.md`](file:///d:/Projek%20Gabut/Rona%20-%20Ambient%20Ekstension/Rona_PRD.md).

Semua AI Agent yang bekerja di workspace ini **WAJIB** mematuhi aturan berikut tanpa pengecualian.

---

## 1. Prinsip Utama Produk (Core Principles)

1. **Visual First, Resource-Aware by Default**: Efek ambient glow harus terasa premium dan sinematik, namun perlindungan performa sistem dan kelancaran playback video adalah prioritas utama yang berjalan otomatis tanpa membebani pengguna dengan pengaturan teknis manual.
2. **Zero-Telemetry & Privacy-First**: 100% on-device. Tidak boleh ada request jaringan keluar, pelacakan analitik, crash reporter, sync server, atau pengiriman data video/pengguna dalam bentuk apa pun.
3. **Quiet When Not Needed**: Segera hentikan rendering dan rilis seluruh resource (frame callback, WebGL context, textures, buffer) maksimal dalam **1 detik** saat video di-pause, selesai, tab di-minimize/hidden, atau navigasi halaman.
4. **Jujur & Transparan (No Fake Diagnostics)**: Panel diagnostik hanya boleh menampilkan metrik yang benar-benar dapat diukur (internal render size, render FPS, status render, adaptive tier). **Dilarang keras** menampilkan atau mengklaim data total RAM sistem atau memory browser.
5. **Graceful Fallback**: Jika hardware acceleration atau WebGL tidak tersedia/gagal, Rona harus menonaktifkan efek secara aman, menampilkan pesan penjelasan ringkas, dan tidak merusak layout maupun playback YouTube.

---

## 2. Batasan Ruang Lingkup (Strict Scope & Non-Goals)

### ✅ Dalam Cakupan (In Scope v1.0)
- Platform: Browser desktop **Chrome** dan **Brave** via **Manifest V3**.
- Target Halaman: **Hanya** standard YouTube watch page (`https://www.youtube.com/watch*`).
- Efek ambient glow dinamis lokal yang membingkai pemutar video.
- Kontrol visual inti: Intensity, blur, spread, fade, dan arah cahaya (direction).
- Dukungan mode pemutar: Normal, Theater, dan Fullscreen.
- Profil konsumsi resource: **Eco**, **Balanced** (default), dan **Cinematic**, dilengkapi **Adaptive Resource Mode**.
- UI: Minimalist dark premium popup (Obsidian theme) & Advanced Diagnostics panel.
- Shortcut keyboard: Default `Alt+Shift+R` via `chrome.commands`.
- Distribusi: GitHub source, MIT License, manual "Load unpacked" ZIP package.

### 🚫 Dilarang Keras / Di Luar Cakupan (Strict Non-Goals)
Setiap agen dilarang mengimplementasikan atau menambahkan fitur berikut tanpa persetujuan eksplisit:
- ❌ **Dilarang inject UI/tombol ke dalam kontrol pemutar YouTube**: Rona tidak boleh menyisipkan elemen ke dalam bar kontrol YouTube (`.ytp-chrome-bottom`, dll.). Semua kontrol ada di Popup atau halaman Settings.
- ❌ **Dilarang mendukung halaman di luar Watch Page**: Jangan aktifkan Rona pada YouTube Home, Search, Shorts, Music, Embedded player, atau situs web non-YouTube.
- ❌ **Dilarang fitur manipulasi video kompleks**: Black-bar detection/removal, video filters, debanding, video crop/zoom, frame blending, atau mengubah resolusi/kualitas video YouTube.
- ❌ **Dilarang Picture-in-Picture (PiP)** atau dukungan browser mobile.
- ❌ **Dilarang penambahan backend/remote**: Tidak ada akun, cloud sync, analytics, crash reporting, ads, atau remote configuration.
- ❌ **Dilarang branding afiliasi**: Jangan gunakan logo, ikon, atau nama yang mengklaim/mengindikasikan afiliasi dengan YouTube atau Google.

---

## 3. Batasan Teknis & Arsitektur (Technical Guardrails)

### 3.1 Izin Manifest (Permission Budget)
- Manifest V3 wajib digunakan.
- Host permissions dibatasi **hanya** untuk domain YouTube watch page yang relevan.
- **DILARANG KERAS** meminta izin `<all_urls>`.
- API browser yang diizinkan untuk v1:
  - `storage` (untuk persistensi preferensi lokal)
  - `commands` (untuk shortcut toggle)

### 3.2 Engine Rendering & Siklus Hidup Frame
- Gunakan `HTMLVideoElement.requestVideoFrameCallback` (rVFC) sebagai penggerak rendering utama untuk mengikat render loop langsung ke frame video riil.
- Hindari loop `requestAnimationFrame` tanpa batas atau `setInterval` untuk animasi ambient.
- **Maksimal 1 instance active renderer per tab**.
- Dilarang menyimpan riwayat frame video (no frame buffer backlog / memory hoarding).
- Hancurkan (dispose) canvas, WebGL context, event listeners, dan DOM nodes saat video berganti atau tidak aktif.

### 3.3 Penempatan DOM & Isolasi Interaksi
- Elemen kanvas/glow ambient harus diletakkan di belakang/sekeliling video.
- Pasang `pointer-events: none` pada layer ambient agar tidak menghalangi klik mouse, keyboard shortcuts bawaan YouTube, tombol navigasi, captions, maupun interaksi iklan.
- Tangani sifat Single Page Application (SPA) YouTube secara resilien (`yt-navigate-finish`, route changes, player element re-mounting).

---

## 4. Profil Resource & Logika Adaptif (Performance Gates)

### 4.1 Batasan Profil Rendering
| Profil | Resolusi Internal Maksimal | Target Render FPS Maksimal | Keterangan |
|---|---|---|---|
| **Eco** | 320 × 180 | 15 FPS | Dirancang untuk perangkat low-end / hemat baterai |
| **Balanced** | 480 × 270 | 24 FPS | **Default profile** untuk stabilitas & estetika |
| **Cinematic** | 640 × 360 | 30 FPS | Kualitas visual tertinggi untuk hardware bertenaga |

### 4.2 Aturan Adaptive Resource Mode
- **Status Awal**: Mulai dari batas atas (cap) profil yang dipilih pengguna.
- **Evaluasi Dropped Frame**: Pantau perubahan dropped frame video dan render cost dalam rolling window 5 detik.
- **Downgrade Tier**: Jika terdeteksi peningkatan dropped frame signifikan, turunkan 1 kualitas tier dalam waktu maksimal **3 detik**.
- **Recovery Tier**: Pemulihan kualitas hanya dilakukan secara konservatif setelah minimal **30 detik stabil**.
- **Batas Atas Mutlak**: Adaptive Resource Mode **TIDAK PERNAH** menaikkan kualitas melampaui profil yang dipilih pengguna (misal: jika user memilih Balanced, kualitas tidak boleh naik ke Cinematic).
- **Target Playback Impact**: Pada mode Balanced, penambahan dropped frame tidak boleh melebihi **1 persentase poin** dibandingkan playback 1080p60 tanpa Rona pada perangkat referensi.

---

## 5. Kontrak Eksekusi Agen & Protokol Eskalasi (Section 12 PRD)

### 5.1 Hierarki Otoritas
1. Dokumen [`Rona_PRD.md`](file:///d:/Projek%20Gabut/Rona%20-%20Ambient%20Ekstension/Rona_PRD.md) adalah sumber kebenaran tertinggi untuk ruang lingkup v1.
2. Kebijakan keamanan browser dan spesifikasi resmi Manifest V3 berlaku jika ada batasan platform yang tidak memungkinkan.
3. Konvensi kode repositori berlaku selama tidak bertentangan dengan PRD.

### 5.2 Kapan Agen Harus BERHENTI dan Eskalasi ke Armand Habib Bachtiar
Agen **WAJIB berhenti** dan meminta konfirmasi kepada **Armand Habib Bachtiar** jika:
1. Muncul kebutuhan atau usulan untuk menambah browser permission, host permission baru, atau request jaringan eksternal.
2. Suatu fitur membutuhkan akses ke area kontrol pemutar video yang berisiko merusak interaksi asli YouTube.
3. Performa Adaptive Resource Mode tidak dapat memenuhi release gate (dropped frame rate <= +1%) setelah mencoba 2 pendekatan implementasi yang berbeda.
4. Solusi teknis memerlukan library/dependency pihak ketiga yang berat atau background service worker yang terus berjalan persisten.
5. Ditemukan potensi konflik lisensi, penamaan, atau kebijakan Chrome Web Store/MV3.

### 5.3 Kewajiban Verifikasi Empiris
- Sesuai FR-01 hingga FR-12 pada PRD, suatu fitur **TIDAK DIANGGAP SELESAI** hanya karena kode telah ditulis.
- Setiap implementasi harus memiliki verifikasi konkret (script pengujian otomatis, pemeriksaan DevTools, atau langkah verifikasi manual yang reproducible).
- Laporkan hasil verifikasi pada ringkasan serah terima (handoff).
