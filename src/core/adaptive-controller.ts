/**
 * Adaptive Resource Mode Controller for Rona (FR-06, FR-07)
 * Adapts internal resolution and FPS caps based on runtime dropped-frame and render-time signals.
 * Never exceeds user-selected profile cap. Recovers cautiously after 30s of stability.
 */

import { PROFILE_CONFIGS, type Resolution, type RonaProfile } from './settings';

export interface AdaptiveControllerOptions {
  selectedProfile: RonaProfile;
  adaptiveEnabled: boolean;
}

export interface FrameSample {
  droppedFramesDelta: number;
  frameDurationMs: number;
}

export interface AdaptiveState {
  activeTier: RonaProfile;
  effectiveFps: number;
  effectiveResolution: Resolution;
  consecutiveStableSeconds: number;
}

const TIER_HIERARCHY: RonaProfile[] = ['eco', 'balanced', 'cinematic'];

export class AdaptiveController {
  private selectedProfile: RonaProfile;
  private adaptiveEnabled: boolean;
  private currentTier: RonaProfile;
  private consecutiveStableSeconds: number = 0;
  private recentDroppedDeltaWindow: number = 0;
  private recentHighRenderWindow: number = 0;

  constructor(options: AdaptiveControllerOptions) {
    this.selectedProfile = options.selectedProfile;
    this.adaptiveEnabled = options.adaptiveEnabled;
    this.currentTier = options.selectedProfile;
  }

  public updateConfig(options: Partial<AdaptiveControllerOptions>): void {
    if (options.selectedProfile !== undefined) {
      this.selectedProfile = options.selectedProfile;
      // Cap current tier if user downgraded profile
      const userMaxIndex = TIER_HIERARCHY.indexOf(this.selectedProfile);
      const currentIndex = TIER_HIERARCHY.indexOf(this.currentTier);
      if (currentIndex > userMaxIndex) {
        this.currentTier = this.selectedProfile;
      }
    }

    if (options.adaptiveEnabled !== undefined) {
      this.adaptiveEnabled = options.adaptiveEnabled;
      if (!this.adaptiveEnabled) {
        this.currentTier = this.selectedProfile;
      }
    }
  }

  public recordSample(sample: FrameSample): void {
    if (!this.adaptiveEnabled) {
      this.currentTier = this.selectedProfile;
      return;
    }

    const hasPressure = sample.droppedFramesDelta > 0 || sample.frameDurationMs > 30;

    if (hasPressure) {
      this.consecutiveStableSeconds = 0;
      this.recentDroppedDeltaWindow += sample.droppedFramesDelta;
      if (sample.frameDurationMs > 30) {
        this.recentHighRenderWindow++;
      }

      // Step down condition: >= 5 dropped frames or >= 2 slow frames
      if (this.recentDroppedDeltaWindow >= 5 || this.recentHighRenderWindow >= 2) {
        this.stepDownTier();
        this.recentDroppedDeltaWindow = 0;
        this.recentHighRenderWindow = 0;
      }
    } else {
      this.consecutiveStableSeconds += 1;
      this.recentDroppedDeltaWindow = 0;
      this.recentHighRenderWindow = 0;

      // Recovery condition: 30 consecutive stable seconds
      if (this.consecutiveStableSeconds >= 30) {
        this.stepUpTier();
        this.consecutiveStableSeconds = 0;
      }
    }
  }

  private lastTierChangeTime: number = 0;

  private stepDownTier(): void {
    const now = Date.now();
    if (now - this.lastTierChangeTime < 3000) {
      return; // cooldown: at most one tier downgrade per 3 seconds
    }

    const currentIndex = TIER_HIERARCHY.indexOf(this.currentTier);
    if (currentIndex > 0) {
      this.currentTier = TIER_HIERARCHY[currentIndex - 1];
      this.lastTierChangeTime = now;
    }
  }

  private stepUpTier(): void {
    const currentIndex = TIER_HIERARCHY.indexOf(this.currentTier);
    const maxIndex = TIER_HIERARCHY.indexOf(this.selectedProfile);

    // Can only upgrade if below user-selected profile
    if (currentIndex < maxIndex) {
      this.currentTier = TIER_HIERARCHY[currentIndex + 1];
      this.lastTierChangeTime = Date.now();
    }
  }

  public getState(): AdaptiveState {
    const config = PROFILE_CONFIGS[this.currentTier];
    return {
      activeTier: this.currentTier,
      effectiveFps: config.maxFps,
      effectiveResolution: { ...config.maxResolution },
      consecutiveStableSeconds: this.consecutiveStableSeconds
    };
  }
}
