# PRD — Rona

**Product:** Rona  
**Release:** v1.0 (GitHub release)  
**Status:** Approved for implementation  
**Owner:** Armand Habib Bachtiar  
**Target:** Chrome and Brave on desktop, Manifest V3

## 1. Overview

Rona is a privacy-first browser extension that adds a premium ambient-light effect around YouTube videos. Its core difference is not merely the visual glow: Rona should actively protect playback smoothness and stop consuming rendering resources when the effect is not useful.

The first release supports only standard YouTube watch pages on desktop. It runs entirely on-device, requires no account, and is distributed as an open-source GitHub release that users load locally in Chrome or Brave.

### Problem

Ambient-video extensions can look good but can also create extra CPU/GPU/VRAM pressure, force users to tune technical settings manually, and sometimes interfere with other YouTube extensions. Rona must provide the expected ambient-light basics while making sensible resource decisions automatically.

### Why now

The competing ambient extension already offers many visual controls, but its own troubleshooting asks users to choose rendering resolution, frame-rate limits, and WebGL settings. Its issue tracker also records main-thread pixel work and GPU-memory-context risks. Rona has a clear opportunity to make the default experience simpler and more resource-aware.

## 2. Product Principles

1. **Visual first, resource-aware by default.** The effect must feel premium before extra features are added; performance protection is automatic rather than a manual chore.
2. **No unnecessary access.** Rona works only on YouTube watch pages, stores settings locally, and sends no user or video data anywhere.
3. **Quiet when not needed.** Pause, hidden-tab, and ended-video states must not keep a renderer running.
4. **Simple surface, honest detail.** Everyday controls stay minimal; diagnostics remain available in Advanced settings without claiming to know total system RAM.
5. **Graceful failure beats forced effects.** If the required rendering capability is unavailable, Rona explains the limitation and leaves YouTube unchanged.

## 3. Goals and Success Metrics

### Goals

- Deliver a polished ambient-light effect for YouTube watch pages.
- Let a normal user use Rona without understanding FPS caps, WebGL resolution, or GPU configuration.
- Preserve smooth playback by adapting effect quality to runtime conditions.
- Make privacy, permission scope, and resource behavior easy to inspect.

### Success metrics and release gates

| Metric | Release target | Measurement |
|---|---|---|
| Effect availability | Ambient effect appears within 2 seconds after a playable YouTube video is ready. | Manual test on five watch pages: standard 16:9, music video, 4K-capable video, ad transition, and navigation between two videos. |
| Playback impact | In Balanced mode, the added dropped-frame rate must be no more than 1 percentage point above the same 1080p60 test video without Rona over 10 minutes on the reference device. | Record YouTube Stats for Nerds before and after in a clean browser profile. |
| Adaptive response | If dropped frames increase materially during a five-second observation window, Rona lowers one quality tier within 3 seconds; after 30 stable seconds, it may recover one tier. | Deterministic test hook plus manual stress test. |
| Inactive cleanup | Rendering stops within 1 second after pause, end, hidden tab, or page navigation. No scheduled video-frame callback remains active after cleanup. | Automated lifecycle tests plus DevTools inspection. |
| No unbounded growth | During a 30-minute playback and a five-minute idle period, Rona's internal renderer count, frame-callback count, and tracked texture/buffer count return to zero when idle and do not trend upward while one video remains active. | Development diagnostics log plus manual soak test. |
| Privacy | Rona makes no network request of its own and contains no analytics, crash reporting, remote configuration, or remote code. | Network-panel audit and static source review. |
| Scope discipline | The production manifest requests only `storage`, `commands`, and the YouTube host permission required for v1. | Manifest review. |

**Reference device:** Lenovo LOQ IRX9, Intel i7-13645HX, 16 GB RAM, RTX 4050 Laptop GPU, current Brave stable.  
**Stress-test device:** ASUS VivoBook X412DA, Ryzen 5 5300U, Vega 8, 4 GB RAM. The stress-test device informs Eco-mode behavior; it is not a compatibility promise.

## 4. Primary User

A desktop YouTube viewer who wants a richer, cinematic presentation but does not want a browser extension that visibly hurts playback, battery, or browser responsiveness. The user expects one obvious on/off control and should not need technical knowledge to use the default mode.

## 5. User Stories and Functional Requirements

| ID | Requirement | Acceptance criteria | Verification and verifier |
|---|---|---|---|
| FR-01 | As a viewer, I can use Rona only on supported YouTube watch pages. | Rona activates only on `https://www.youtube.com/watch*` when a playable video exists; it does nothing on YouTube home, search, Shorts, Music, embeds, or other domains. | Automated URL-matching tests; IDE executor verifies, owner spot-checks. |
| FR-02 | As a viewer, I see a dynamic ambient glow that follows the current video colors. | The effect visibly updates while video plays, surrounds rather than covers the player, does not alter playback controls, and can be turned off instantly. | Manual visual acceptance on the five-page matrix; owner verifies. |
| FR-03 | As a viewer, I can tune the core look without technical jargon. | Settings provide intensity, blur, spread, fade, and directional controls. Changes apply immediately and persist after browser restart. | UI and persistence tests; executor verifies, owner checks feel and polish. |
| FR-04 | As a viewer, I can use Rona in normal, theater, and fullscreen video modes. | The effect remains correctly positioned after mode changes, player resize, navigation, and switching to another video. | Manual navigation/resizing test; executor verifies. |
| FR-05 | As a viewer, I can control Rona from a premium, uncluttered popup. | Popup contains a master toggle, current mode, Eco/Balanced/Cinematic selector, and a Settings entry. It does not inject a button into YouTube's player controls. | Manual UI review and compatibility check with another YouTube extension; owner verifies. |
| FR-06 | As a viewer, Rona automatically protects playback when my device is struggling. | `Adaptive Resource Mode` is enabled by default. It adjusts rendering quality using dropped-frame and render-cost signals, never changes the video's selected quality, and shows the active tier in the popup. | Automated adaptive-state tests plus stress test; executor verifies. |
| FR-07 | As a viewer, I can choose a predictable resource profile. | Eco, Balanced, and Cinematic are available. Eco targets a maximum 320×180 internal frame at 15 FPS; Balanced 480×270 at 24 FPS; Cinematic 640×360 at 30 FPS. Adaptive downgrades from the selected profile when needed but never upgrades beyond it. | Unit tests for profile caps and manual diagnostics check; executor verifies. |
| FR-08 | As a viewer, Rona stays quiet when the effect has no value. | Rona releases the active render loop and renderer resources on pause, end, hidden tab, and SPA navigation; it resumes safely when playback resumes. | Lifecycle tests and 30-minute soak test; executor verifies. |
| FR-09 | As a viewer, I can use a shortcut. | A configurable browser command toggles Rona for the current supported tab. Default: `Alt+Shift+R`; conflict or browser restrictions are surfaced in Settings. | Manual command test in Chrome and Brave; executor verifies. |
| FR-10 | As a viewer who wants transparency, I can inspect a small Advanced diagnostics panel. | Panel shows selected profile, current adaptive tier, current render FPS cap, internal render size, and whether rendering is active. It does **not** claim exact system RAM or total browser memory. | UI test and content review; owner verifies wording. |
| FR-11 | As a privacy-conscious viewer, I know what Rona accesses. | Settings/About clearly states that processing and settings remain local, Rona runs only on YouTube watch pages, and it sends no telemetry. | Static review and manual copy review; owner verifies. |
| FR-12 | As a viewer on an unsupported graphics configuration, I receive a safe fallback. | If required rendering capability is unavailable, Rona disables the effect for that tab, shows a concise explanation and troubleshooting action, and does not alter the video or page layout. | Capability-failure test; executor verifies. |

## 6. Scope

### In scope for v1

- Chrome and Brave desktop support through Manifest V3.
- Standard YouTube watch pages only.
- Dynamic local ambient glow rendered around the video.
- Intensity, blur, spread, fade, and direction settings.
- Normal, theater, and fullscreen support.
- Local settings persistence and keyboard toggle.
- Eco, Balanced, and Cinematic profiles with Adaptive Resource Mode.
- Minimal dark premium popup and Advanced diagnostics.
- GitHub source, MIT license, release ZIP, installation guide, privacy statement, and benchmark template.

### Explicitly out of scope for v1

- YouTube Shorts, YouTube Music, embedded players, live-chat layouts, and non-YouTube websites.
- Black/colored-bar detection or removal.
- Video filters, video zoom/crop, frame blending, debanding, or video-quality control.
- Picture-in-picture support.
- A button inserted into YouTube player controls.
- Mobile browsers.
- Accounts, cloud sync, backend services, telemetry, ads, analytics, crash reporting, or remote configuration.
- Chrome Web Store distribution, payment, or automated extension updates.

### Deferred opportunities

- Black-bar handling after it can meet the resource budget.
- Additional visual presets and mirrored-edge mode.
- YouTube embeds, Shorts, YouTube Music, and selected non-DRM HTML5 video sites.
- Firefox and Edge packaging.
- Store publication once distribution requirements are acceptable.

## 7. Solution Design

### User experience

Rona opens with a small dark, premium popup. Its main surface shows:

- `Rona` wordmark
- master toggle
- current state: `Adaptive · Eco`, `Adaptive · Balanced`, or `Adaptive · Cinematic`
- three profile choices
- Settings link

The popup uses a neutral obsidian base. A restrained accent can reflect the active video palette only while Rona is enabled; the interface must never become visually loud or depend on a fixed neon color. Advanced settings contain the core visual sliders, shortcut guidance, privacy statement, and diagnostics.

### Adaptive Resource Mode

Adaptive Resource Mode is enabled by default. It should:

1. Start at the cap of the selected profile.
2. Observe video dropped-frame changes and render cost over short rolling windows.
3. Step down internal resolution, effect FPS, or blur complexity before playback becomes visibly unstable.
4. Stop all rendering when playback is paused, ended, hidden, or replaced.
5. Recover quality cautiously after sustained stability, never exceeding the user-selected profile.

Rona must describe this as adaptive quality management, not as an exact RAM limiter. Browser and GPU memory accounting is not reliable enough for a user-facing promise.

## 8. Technical Considerations

- Use Manifest V3.
- Restrict host access to YouTube rather than `<all_urls>`.
- Use `chrome.storage` for local settings and `chrome.commands` for the shortcut.
- Treat YouTube as a single-page application: detect route, player, and video replacement changes safely.
- Use video-frame-driven rendering where supported; avoid a permanent unconstrained animation loop.
- Keep at most one active renderer per tab and do not retain a frame history.
- Dispose of callbacks, canvas/WebGL resources, and DOM nodes when the effect is inactive or a video changes.
- Do not rely on background page persistence, remote services, or heavyweight rendering frameworks unless approved by the owner.
- Rendering must be layered behind/around the video without intercepting clicks, keyboard playback controls, captions, ads, or YouTube's own controls.
- The extension must not copy, upload, record, download, or analyze video content beyond the local pixels necessary to render the current ambient effect.

## 9. Dependencies and Risks

| Risk or dependency | Impact | Mitigation | Owner |
|---|---|---|---|
| YouTube DOM or player updates | Effect may fail to attach or position. | Use resilient element detection, route handling, and explicit smoke tests after YouTube UI changes. | IDE executor during build; Armand after release. |
| Browser/GPU differences | WebGL behavior, video decode, and fullscreen can differ. | Require hardware acceleration; provide safe disabled state; test Chrome and Brave on the reference device. | IDE executor. |
| Performance target is not met | The core promise becomes untrustworthy. | Reduce effect complexity before adding scope; validate Eco and Balanced before Cinematic. | Armand decides trade-offs. |
| Feature creep | Resource-focused v1 becomes a clone of every competitor feature. | Treat Out of Scope list as binding. | Armand. |
| GitHub-only distribution | Installation is less convenient and updates are manual. | Provide a release ZIP, screenshots, exact Load unpacked steps, and versioned changelog. | Armand. |
| Name availability | `Rona` may overlap with unrelated projects or marks. | Treat Rona as a project name for this release; conduct a formal clearance only before commercial/store launch. | Armand. |

## 10. Timeline and Milestones

| Milestone | Deliverable | Exit criteria |
|---|---|---|
| M1 — Foundation | MV3 scaffold, limited permissions, popup shell, YouTube watch-page detection. | FR-01 and manifest review pass. |
| M2 — Core ambient | Dynamic effect plus normal/theater/fullscreen positioning and core visual controls. | FR-02 through FR-04 pass. |
| M3 — Adaptive lifecycle | Profiles, Adaptive Resource Mode, lifecycle cleanup, shortcut, diagnostics. | FR-06 through FR-10 pass. |
| M4 — Validation | Benchmark capture, privacy/network audit, compatibility and failure-path checks. | All release gates in Section 3 pass or are documented as blocked for owner decision. |
| M5 — GitHub release | README, MIT license, privacy statement, release ZIP, install guide, changelog. | Owner accepts release candidate. |

## 11. Open Questions

No open product decisions block v1 implementation. Future support for black bars, more YouTube surfaces, other browsers, and store distribution is intentionally deferred.

## 12. Agent Execution Contract

### Authoritative sources and precedence

1. This PRD is authoritative for v1 scope, behavior, acceptance criteria, and non-goals.
2. Official Chrome extension documentation and browser security/policy constraints override this PRD where implementation would otherwise be unsafe or impossible.
3. The existing repository, once created, is authoritative for implementation conventions that do not conflict with this PRD.
4. If two sources conflict, the executor must stop and escalate to **Armand Habib Bachtiar** with the conflict, options, impact, and recommended choice.

### Required delivery

- A buildable Manifest V3 extension source repository.
- Tests or repeatable test scripts covering URL gating, setting persistence, adaptive transitions, lifecycle cleanup, and error fallback.
- README containing installation instructions for Chrome/Brave Load unpacked, supported scope, permissions, privacy promise, known limitations, and benchmark procedure.
- `LICENSE` with MIT license text.
- `PRIVACY.md` stating no telemetry or network access by Rona.
- A release-ready ZIP containing the built extension directory, not source dependencies or secrets.

### Must not change or add without approval

- Do not add hosts beyond YouTube or request `<all_urls>`.
- Do not add accounts, analytics, telemetry, crash reporting, remote configuration, remote code, cloud sync, ads, or any server dependency.
- Do not inject UI into YouTube player controls.
- Do not implement black-bar removal, video filters, PiP, Shorts, embeds, mobile, or other-site support in v1.
- Do not use branding that implies affiliation with YouTube or Google.
- Do not commit credentials, generated personal data, downloaded videos, or browser profiles.

### Stop and escalate to Armand when

- Any additional browser permission, host permission, network request, or third-party data transfer is proposed.
- A required feature needs access to video controls or page areas that risks breaking YouTube interactions.
- Adaptive behavior cannot meet the stated playback or cleanup gates after two materially different local implementation approaches.
- The only workable path requires a heavyweight dependency, persistent background execution, or a scope-expanding feature.
- A licensing conflict, Rona naming conflict, or browser policy concern appears.

### Verification responsibility

The IDE executor must run and report the verification named for every FR in Section 5. Armand is the final product approver for visual quality, copy, scope exceptions, benchmark trade-offs, and release publication. A requirement is not complete merely because it appears implemented; its listed verification must be recorded in the handoff summary.

## Appendix A — Research References

- Competitor Chrome Web Store listing: https://chromewebstore.google.com/detail/ambient-light-for-youtube/paponcgjfojgemddooebbgniglhkajkj
- Competitor performance guide: https://github.com/WesselKroos/youtube-ambilight/blob/develop/TROUBLESHOOT.md
- Competitor issue on worker/main-thread work and GPU-memory limits: https://github.com/WesselKroos/youtube-ambilight/issues/300
- Chrome guide for unpacked extensions: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world
- HTMLVideoElement `requestVideoFrameCallback`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback

