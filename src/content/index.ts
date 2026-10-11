/**
 * Content Script for Rona (MV3)
 * Operates on YouTube pages, activating ambient lighting strictly on valid watch pages.
 * Resilient against SPA navigation, player re-mounts, and theater mode toggles.
 * Delivers dynamic ambient lighting while protecting playback performance.
 * Fully compliant with PRD v1.0 specifications and operating rules.
 */

import { isSupportedYouTubeWatchUrl } from '../core/url-matcher';
import { loadStoredSettings, saveStoredSettings, type RonaSettings } from '../core/settings';
import { AdaptiveController } from '../core/adaptive-controller';
import { LifecycleManager } from '../core/lifecycle-manager';
import { checkRenderingCapability, handleCapabilityFailure } from '../core/capability';

class RonaContentEngine {
  private settings: RonaSettings | null = null;
  private adaptiveController: AdaptiveController | null = null;
  private lifecycleManager: LifecycleManager | null = null;

  private containerEl: HTMLDivElement | null = null;
  private displayCanvas: HTMLCanvasElement | null = null;
  private displayCtx: CanvasRenderingContext2D | null = null;

  private sampleCanvas: HTMLCanvasElement | null = null;
  private sampleCtx: CanvasRenderingContext2D | null = null;

  private currentVideoEl: HTMLVideoElement | null = null;
  private currentBoundContainer: HTMLElement | null = null;
  private videoCleanupFn: (() => void) | null = null;

  private rvfcHandle: number | null = null;
  private rafHandle: number | null = null;

  private lastRenderTime: number = 0;
  private lastSampleDroppedTotal: number = 0;
  private isDestroyed: boolean = false;
  private mutationObserver: MutationObserver | null = null;
  private attachRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private attachAttempts: number = 0;
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.ensureGlobalStyles();
    this.settings = await loadStoredSettings();

    this.adaptiveController = new AdaptiveController({
      selectedProfile: this.settings.profile,
      adaptiveEnabled: this.settings.adaptiveMode
    });

    this.lifecycleManager = new LifecycleManager({
      onStop: () => this.stopRenderLoop(),
      onResume: () => this.startRenderLoop()
    });

    // Always attach global communication & navigation listeners
    this.setupMessageListener();
    this.setupStorageListener();
    this.setupKeyboardShortcutListener();
    this.setupSpaListeners();
    this.setupMutationObserver();
    this.setupWatchdog();

    // Evaluate initial page state
    this.evaluateRouteAndAttach();
  }

  /**
   * Injects global stylesheet to ensure YouTube's player wrappers allow ambient overflow
   * and properly stack the video player in front of the ambient glow.
   */
  private ensureGlobalStyles(): void {
    if (document.getElementById('rona-ambient-styles')) return;

    const style = document.createElement('style');
    style.id = 'rona-ambient-styles';
    style.textContent = `
      #rona-ambient-container {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: 0 !important;
        overflow: visible !important;
      }
      #rona-ambient-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        transform-origin: center center !important;
        will-change: transform, filter, opacity !important;
        transition: opacity 0.3s ease, filter 0.2s ease, transform 0.2s ease !important;
      }
      #player,
      #player-container-outer,
      #player-container-inner,
      #player-container,
      #full-bleed-container,
      ytd-player,
      #container.ytd-player {
        overflow: visible !important;
      }
      #movie_player {
        z-index: 1 !important;
        position: relative !important;
      }
      .html5-video-player .ytp-chrome-bottom,
      .html5-video-player .ytp-chrome-top {
        z-index: 60 !important;
      }
      ytd-watch-flexy[fullscreen] #rona-ambient-container,
      :fullscreen #rona-ambient-container {
        display: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  /**
   * Listen to messages from popup or background worker.
   */
  private setupMessageListener(): void {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'RONA_SETTINGS_CHANGED' && message.settings) {
        this.updateSettings(message.settings);
        sendResponse({ success: true });
      } else if (message.type === 'RONA_TOGGLE') {
        this.toggleEnabled().then(() => sendResponse({ success: true }));
        return true;
      } else if (message.type === 'RONA_GET_STATUS') {
        sendResponse({
          success: true,
          status: this.getStatus()
        });
      }
      return true;
    });
  }

  /**
   * Directly listen to chrome.storage.onChanged for real-time reactivity
   * whenever popup or options page updates settings.
   */
  private setupStorageListener(): void {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.rona_settings_v1?.newValue) {
        this.updateSettings(changes.rona_settings_v1.newValue);
      }
    });
  }

  /**
   * Resilient in-page keyboard shortcut handler.
   * Supports Alt+Shift+R, Alt+R (Windows IME collision-free), and Alt+A / Alt+Shift+A.
   * Catches events in the capture phase on both window and document.
   */
  private setupKeyboardShortcutListener(): void {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in search, comments, or inputs
      const target = (e.composedPath ? e.composedPath()[0] : e.target) as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          (typeof target.closest === 'function' && target.closest('input, textarea, [contenteditable="true"]')))
      ) {
        return;
      }

      // Modifier validation: Alt must be pressed; Ctrl and Meta must NOT be pressed
      if (e.ctrlKey || e.metaKey || !e.altKey) {
        return;
      }

      const keyLower = e.key ? e.key.toLowerCase() : '';
      const code = e.code;
      const isR = keyLower === 'r' || code === 'KeyR';
      const isA = keyLower === 'a' || code === 'KeyA';

      if (isR || isA) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        this.toggleEnabled();
      }
    };

    window.addEventListener('keydown', handleKey, { capture: true });
    document.addEventListener('keydown', handleKey, { capture: true });
  }

  /**
   * Toggle extension enabled status with immediate local reactivity and persistence.
   */
  private async toggleEnabled(): Promise<void> {
    const currentEnabled = this.settings?.enabled ?? true;
    const newEnabled = !currentEnabled;

    if (this.settings) {
      this.updateSettings({ ...this.settings, enabled: newEnabled });
    }
    await saveStoredSettings({ enabled: newEnabled });
  }

  /**
   * Setup listeners for YouTube's client-side SPA navigation and visibility changes.
   */
  private setupSpaListeners(): void {
    const handleNavigation = () => {
      this.evaluateRouteAndAttach();
    };

    window.addEventListener('yt-navigate-finish', handleNavigation);
    window.addEventListener('yt-page-data-updated', handleNavigation);
    window.addEventListener('yt-player-updated', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    // Watch for URL changes on SPA pushState / replaceState
    let prevUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== prevUrl) {
        prevUrl = window.location.href;
        handleNavigation();
      }
    }, 400);

    // Tab visibility handling (FR-08)
    document.addEventListener('visibilitychange', () => {
      if (this.lifecycleManager) {
        this.lifecycleManager.setVisibilityState(document.visibilityState);
      }
    });
  }

  /**
   * Self-healing watchdog: checks every 1000ms if on a watch page to ensure
   * the ambient container and video bindings stay alive after video transitions.
   */
  private setupWatchdog(): void {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);

    this.watchdogInterval = setInterval(() => {
      if (!isSupportedYouTubeWatchUrl(window.location.href) || !this.settings?.enabled) {
        return;
      }

      const watchFlexy = document.querySelector('ytd-watch-flexy');
      const video = (watchFlexy?.querySelector('video.html5-main-video') as HTMLVideoElement | null) ||
                    (document.querySelector('video.html5-main-video') as HTMLVideoElement | null);

      if (video) {
        const isContainerDisconnected = !this.containerEl || !this.containerEl.isConnected;
        const isVideoChanged = this.currentVideoEl !== video || !this.currentVideoEl.isConnected;

        if (isContainerDisconnected || isVideoChanged) {
          this.attachToVideoPlayer();
        } else if (!video.paused && !video.ended && !this.lifecycleManager?.isRenderingActive()) {
          this.lifecycleManager?.setPlaybackState('playing');
        }
      }
    }, 1000);
  }

  /**
   * Observe DOM mutations to detect when YouTube mounts player or replaces video element.
   */
  private setupMutationObserver(): void {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.mutationObserver = new MutationObserver(() => {
      if (!isSupportedYouTubeWatchUrl(window.location.href)) return;

      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;

        const currentVideo = document.querySelector('ytd-watch-flexy video.html5-main-video') as HTMLVideoElement | null;
        const isVideoMissingOrChanged = !this.currentVideoEl || !this.currentVideoEl.isConnected || (currentVideo && currentVideo !== this.currentVideoEl);
        const isContainerDisconnected = !this.containerEl || !this.containerEl.isConnected;

        if (isVideoMissingOrChanged || isContainerDisconnected) {
          this.attachToVideoPlayer();
        }
      }, 300);
    });

    this.mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Gating check: activate engine on watch pages, teardown on non-watch pages (FR-01).
   */
  private evaluateRouteAndAttach(): void {
    if (isSupportedYouTubeWatchUrl(window.location.href)) {
      this.attachToVideoPlayer();
    } else {
      this.teardown();
    }
  }

  /**
   * Robustly attach to YouTube's player container and video element.
   */
  private attachToVideoPlayer(): void {
    this.isDestroyed = false;
    this.attachAttempts = 0;

    if (this.attachRetryTimer) {
      clearTimeout(this.attachRetryTimer);
      this.attachRetryTimer = null;
    }

    const findVideoAndPlayer = () => {
      if (this.isDestroyed || !isSupportedYouTubeWatchUrl(window.location.href)) return;

      const watchFlexy = document.querySelector('ytd-watch-flexy');

      // Specifically prioritize the main video inside ytd-watch-flexy to avoid preview players on home
      const video = (watchFlexy?.querySelector('video.html5-main-video') as HTMLVideoElement | null) ||
                    (document.querySelector('ytd-watch-flexy video') as HTMLVideoElement | null) ||
                    (document.querySelector('video.html5-main-video') as HTMLVideoElement | null) ||
                    (document.querySelector('video') as HTMLVideoElement | null);

      // Identify active player container (handles both Default and Theater modes)
      const playerContainer =
        (watchFlexy?.querySelector('ytd-player#ytd-player') as HTMLElement) ||
        (video?.closest('ytd-player') as HTMLElement) ||
        (watchFlexy?.querySelector('#full-bleed-container') as HTMLElement) ||
        (watchFlexy?.querySelector('#player') as HTMLElement) ||
        (document.querySelector('#player-container') as HTMLElement) ||
        (video?.closest('#movie_player') as HTMLElement) ||
        (video?.parentElement as HTMLElement);

      if (video && playerContainer) {
        this.bindVideo(video, playerContainer);
      } else if (this.attachAttempts < 40) {
        this.attachAttempts++;
        this.attachRetryTimer = setTimeout(findVideoAndPlayer, 300);
      }
    };

    findVideoAndPlayer();
  }

  /**
   * Bind video events and mount canvas elements.
   */
  private bindVideo(video: HTMLVideoElement, playerContainer: HTMLElement): void {
    // If already cleanly bound to this video and container
    if (
      this.currentVideoEl === video &&
      this.currentBoundContainer === playerContainer &&
      this.containerEl &&
      this.containerEl.isConnected &&
      this.containerEl.parentElement === playerContainer
    ) {
      this.applyVisualStyles();
      if (!video.paused && !video.ended) {
        this.lifecycleManager?.setPlaybackState('playing');
      }
      return;
    }

    this.cleanupVideoBindings();
    this.currentVideoEl = video;
    this.currentBoundContainer = playerContainer;

    // Ensure player container has relative positioning so ambient container aligns correctly
    const containerPos = window.getComputedStyle(playerContainer).position;
    if (containerPos === 'static') {
      playerContainer.style.position = 'relative';
    }

    // Create Canvas elements
    this.createDomElements(playerContainer);

    if (!this.displayCanvas) return;

    // Capability check (FR-12)
    const capability = checkRenderingCapability(this.displayCanvas);
    if (!capability.supported) {
      handleCapabilityFailure(capability.reason || 'Hardware acceleration unavailable');
      this.teardown();
      return;
    }

    // Bind video events to LifecycleManager (FR-08)
    const onPlay = () => {
      this.lifecycleManager?.setPlaybackState('playing');
      this.applyVisualStyles();
    };
    const onPause = () => this.lifecycleManager?.setPlaybackState('paused');
    const onEnded = () => this.lifecycleManager?.setPlaybackState('ended');
    const onPlayingOrActive = () => {
      if (!video.paused && !video.ended) {
        // Self-heal check: if container was removed during play, re-mount
        if (!this.containerEl || !this.containerEl.isConnected) {
          this.attachToVideoPlayer();
        } else {
          this.lifecycleManager?.setPlaybackState('playing');
        }
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onPlayingOrActive);
    video.addEventListener('loadeddata', onPlayingOrActive);
    video.addEventListener('canplay', onPlayingOrActive);

    this.videoCleanupFn = () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onPlayingOrActive);
      video.removeEventListener('loadeddata', onPlayingOrActive);
      video.removeEventListener('canplay', onPlayingOrActive);
    };

    // Initial state check
    if (!video.paused && !video.ended) {
      this.lifecycleManager?.setPlaybackState('playing');
    }

    this.applyVisualStyles();
  }

  private createDomElements(playerContainer: HTMLElement): void {
    // Remove existing container if any
    const existing = document.getElementById('rona-ambient-container');
    if (existing) {
      existing.remove();
    }

    // Container placed behind video with pointer-events: none
    const container = document.createElement('div');
    container.id = 'rona-ambient-container';
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '0';
    container.style.overflow = 'visible';
    container.style.display = this.settings?.enabled ? 'block' : 'none';

    // Display Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'rona-ambient-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.transformOrigin = 'center center';

    container.appendChild(canvas);

    // Insert as the first child of player container so it renders strictly behind video
    if (playerContainer.firstChild) {
      playerContainer.insertBefore(container, playerContainer.firstChild);
    } else {
      playerContainer.appendChild(container);
    }

    this.containerEl = container;
    this.displayCanvas = canvas;
    this.displayCtx = canvas.getContext('2d', { alpha: true });

    // Offscreen sampling canvas
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    this.applyVisualStyles();
  }

  private applyVisualStyles(): void {
    if (!this.displayCanvas || !this.settings) return;

    // Scale calculation based on Spread setting (30 default -> 1.25x scale)
    const spreadFraction = this.settings.spread / 100;
    const scale = (1.15 + spreadFraction * 0.35).toFixed(3);

    // Blur calculation (40 default -> 44px blur)
    const blurPx = Math.round((this.settings.blur / 100) * 55 + 22);

    // Opacity, Brightness, and Saturation based on Intensity
    const intensityFraction = this.settings.intensity / 100;
    const opacity = intensityFraction.toFixed(2);
    const brightness = Math.round(100 + intensityFraction * 35);
    const saturate = Math.round(110 + intensityFraction * 50);

    // Directional clip / mask
    let clipPath = 'none';
    if (this.settings.direction === 'top') {
      clipPath = 'inset(0 0 50% 0)';
    } else if (this.settings.direction === 'bottom') {
      clipPath = 'inset(50% 0 0 0)';
    } else if (this.settings.direction === 'sides') {
      clipPath = 'polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%, 75% 100%, 100% 100%, 100% 0%, 75% 0%)';
    }

    this.displayCanvas.style.transform = `scale(${scale})`;
    this.displayCanvas.style.filter = `blur(${blurPx}px) brightness(${brightness}%) saturate(${saturate}%)`;
    this.displayCanvas.style.opacity = opacity;
    this.displayCanvas.style.clipPath = clipPath;

    if (this.containerEl) {
      this.containerEl.style.display = this.settings.enabled ? 'block' : 'none';
    }
  }

  private startRenderLoop(): void {
    if (!this.settings?.enabled || this.isDestroyed) return;
    this.scheduleNextFrame();
  }

  private stopRenderLoop(): void {
    if (this.rvfcHandle !== null && this.currentVideoEl && 'cancelVideoFrameCallback' in this.currentVideoEl) {
      (this.currentVideoEl as any).cancelVideoFrameCallback(this.rvfcHandle);
      this.rvfcHandle = null;
    }
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    // Clear display canvas when idle (FR-08)
    if (this.displayCtx && this.displayCanvas) {
      this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
    }
  }

  private scheduleNextFrame(): void {
    if (!this.lifecycleManager?.isRenderingActive() || !this.settings?.enabled) {
      return;
    }

    if (this.currentVideoEl && 'requestVideoFrameCallback' in this.currentVideoEl) {
      this.rvfcHandle = (this.currentVideoEl as any).requestVideoFrameCallback(
        (_now: number, metadata: any) => {
          this.rvfcHandle = null;
          this.renderFrame(metadata);
          this.scheduleNextFrame();
        }
      );
    } else {
      // Fallback to rAF
      this.rafHandle = requestAnimationFrame((now) => {
        this.rafHandle = null;
        this.renderFrame(null, now);
        this.scheduleNextFrame();
      });
    }
  }

  private renderFrame(metadata: any, fallbackNow?: number): void {
    if (
      !this.currentVideoEl ||
      !this.displayCanvas ||
      !this.displayCtx ||
      !this.sampleCanvas ||
      !this.sampleCtx ||
      !this.adaptiveController ||
      this.currentVideoEl.readyState < 2 ||
      this.currentVideoEl.videoWidth === 0 ||
      this.currentVideoEl.videoHeight === 0
    ) {
      return;
    }

    // Self-healing check: if DOM element detached during video playback, re-attach immediately
    if (!this.containerEl || !this.containerEl.isConnected) {
      this.attachToVideoPlayer();
      return;
    }

    const state = this.adaptiveController.getState();
    const minFrameIntervalMs = 1000 / state.effectiveFps;
    const now = fallbackNow || performance.now();

    // Enforce FPS throttle based on current adaptive tier
    if (now - this.lastRenderTime < minFrameIntervalMs) {
      return;
    }
    this.lastRenderTime = now;

    const renderStartTime = performance.now();

    // 1. Offscreen sample canvas resize to current tier resolution
    const targetRes = state.effectiveResolution;
    if (this.sampleCanvas.width !== targetRes.width || this.sampleCanvas.height !== targetRes.height) {
      this.sampleCanvas.width = targetRes.width;
      this.sampleCanvas.height = targetRes.height;
    }

    // 2. Display canvas resolution matches sample resolution for ultra-fast blitting
    if (this.displayCanvas.width !== targetRes.width || this.displayCanvas.height !== targetRes.height) {
      this.displayCanvas.width = targetRes.width;
      this.displayCanvas.height = targetRes.height;
    }

    try {
      // 3. Draw downscaled video frame to sample canvas
      this.sampleCtx.drawImage(
        this.currentVideoEl,
        0,
        0,
        this.sampleCanvas.width,
        this.sampleCanvas.height
      );

      // 4. Render smoothed frame directly to display canvas
      this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
      this.displayCtx.imageSmoothingEnabled = true;
      this.displayCtx.imageSmoothingQuality = 'medium';

      this.displayCtx.drawImage(
        this.sampleCanvas,
        0,
        0,
        this.displayCanvas.width,
        this.displayCanvas.height
      );
    } catch {
      // Catch transient media errors (e.g. ad switchover)
    }

    const renderDurationMs = performance.now() - renderStartTime;

    // 5. Sample dropped frames and feed AdaptiveController (FR-06)
    let droppedDelta = 0;
    if (metadata && typeof metadata.presentedFrames === 'number') {
      const currentDropped = (this.currentVideoEl as any).getVideoPlaybackQuality?.()?.droppedVideoFrames ?? 0;
      droppedDelta = Math.max(0, currentDropped - this.lastSampleDroppedTotal);
      this.lastSampleDroppedTotal = currentDropped;
    } else {
      const currentDropped = (this.currentVideoEl as any).getVideoPlaybackQuality?.()?.droppedVideoFrames ?? 0;
      droppedDelta = Math.max(0, currentDropped - this.lastSampleDroppedTotal);
      this.lastSampleDroppedTotal = currentDropped;
    }

    this.adaptiveController.recordSample({
      droppedFramesDelta: droppedDelta,
      frameDurationMs: renderDurationMs
    });
  }

  public updateSettings(newSettings: RonaSettings): void {
    this.settings = newSettings;
    this.adaptiveController?.updateConfig({
      selectedProfile: newSettings.profile,
      adaptiveEnabled: newSettings.adaptiveMode
    });

    this.applyVisualStyles();

    if (newSettings.enabled) {
      if (this.currentVideoEl && !this.currentVideoEl.paused && !this.currentVideoEl.ended) {
        this.lifecycleManager?.setPlaybackState('playing');
      }
    } else {
      this.stopRenderLoop();
    }
  }

  public getStatus() {
    const isWatch = isSupportedYouTubeWatchUrl(window.location.href);
    const adaptiveState = this.adaptiveController?.getState();
    const isRendering = this.lifecycleManager?.isRenderingActive() ?? false;
    const isPaused = this.currentVideoEl ? this.currentVideoEl.paused : true;

    return {
      selectedProfile: this.settings?.profile ?? 'balanced',
      activeTier: adaptiveState?.activeTier ?? 'balanced',
      adaptiveEnabled: this.settings?.adaptiveMode ?? true,
      fpsCap: adaptiveState?.effectiveFps ?? 24,
      internalWidth: adaptiveState?.effectiveResolution.width ?? 480,
      internalHeight: adaptiveState?.effectiveResolution.height ?? 270,
      isRenderingActive: isRendering,
      isWatchPage: isWatch,
      isPaused: isPaused
    };
  }

  private cleanupVideoBindings(): void {
    this.stopRenderLoop();
    this.videoCleanupFn?.();
    this.videoCleanupFn = null;
    this.currentVideoEl = null;
    this.currentBoundContainer = null;
  }

  private teardown(): void {
    this.isDestroyed = true;
    if (this.attachRetryTimer) {
      clearTimeout(this.attachRetryTimer);
      this.attachRetryTimer = null;
    }
    this.lifecycleManager?.handleSpaNavigationStart();
    this.cleanupVideoBindings();

    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
      this.displayCanvas = null;
      this.displayCtx = null;
      this.sampleCanvas = null;
      this.sampleCtx = null;
    }
  }
}

// Instantiate engine when content script loads
new RonaContentEngine();
