# Privacy Policy — Rona

**Effective Date:** 2026-10-10  
**Product:** Rona (Browser Extension v1.0)  
**Author:** Armand Habib Bachtiar  

---

## 1. Our Privacy Philosophy

Rona is built on a strict **zero-telemetry, privacy-first** architecture. We believe browser extensions should enhance your experience without tracking, profiling, or collecting any information about what you watch.

---

## 2. Data Collection and Transmission

- **No Remote Servers:** Rona operates 100% on-device inside your browser. It does not contact any external API, server, or cloud service.
- **No Analytics or Telemetry:** Rona contains zero trackers, analytics scripts, crash reporting frameworks, or remote configuration services.
- **No Video Data Stored or Uploaded:** Video frames are sampled ephemerally in local memory canvas contexts purely to compute ambient lighting colors for the current active frame. No frames, pixels, titles, URLs, or metadata are ever saved to disk, recorded, or transmitted.
- **Zero Third-Party Code:** No external CDNs, tracking SDKs, or third-party libraries are embedded.

---

## 3. Permissions Requested and Why

Rona adheres to the principle of least privilege in Manifest V3:

| Permission | Purpose |
|---|---|
| `storage` | Used exclusively to save your local UI preferences (visual slider levels, selected profile, adaptive mode toggle) in `chrome.storage.local`. This data never leaves your computer. |
| `commands` | Enables the configurable keyboard shortcut (`Alt+Shift+R`) to toggle the ambient effect on and off. |
| `*://www.youtube.com/watch*` (Host Permission) | Strictly scoped only to standard YouTube video watch pages where the ambient lighting effect is rendered. Rona does not run on YouTube Home, Search, Shorts, Music, embeds, or any other website. |

Rona **never** requests `<all_urls>` or invasive web request interception permissions.

---

## 4. Contact

If you have questions about Rona's privacy design, please inspect the open-source code on GitHub or open an issue in the repository.
