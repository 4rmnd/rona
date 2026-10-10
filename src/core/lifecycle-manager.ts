/**
 * Lifecycle Manager for Rona (FR-08)
 * Ensures rendering stops and releases resources within 1s on pause, end, hidden tab, or SPA navigation.
 * Resumes cleanly when conditions return to active watch playback.
 */

export type PlaybackState = 'playing' | 'paused' | 'ended';
export type VisibilityState = 'visible' | 'hidden';

export interface LifecycleCallbacks {
  onStop: () => void;
  onResume: () => void;
}

export class LifecycleManager {
  private playbackState: PlaybackState = 'paused';
  private visibilityState: VisibilityState = 'visible';
  private isRendering: boolean = false;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: LifecycleCallbacks;

  constructor(callbacks: LifecycleCallbacks) {
    this.callbacks = callbacks;
  }

  public setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.evaluateState();
  }

  public setVisibilityState(state: VisibilityState): void {
    this.visibilityState = state;
    this.evaluateState();
  }

  public handleSpaNavigationStart(): void {
    this.playbackState = 'paused';
    this.clearStopTimer();
    this.stopRenderingImmediate();
  }

  public isRenderingActive(): boolean {
    return this.isRendering;
  }

  private evaluateState(): void {
    const shouldBeActive = this.playbackState === 'playing' && this.visibilityState === 'visible';

    if (shouldBeActive) {
      this.clearStopTimer();
      if (!this.isRendering) {
        this.isRendering = true;
        this.callbacks.onResume();
      }
    } else {
      // Inactive cleanup within 1 second gate
      if (this.isRendering && !this.stopTimer) {
        this.stopTimer = setTimeout(() => {
          this.stopTimer = null;
          this.stopRenderingImmediate();
        }, 1000);
      }
    }
  }

  private stopRenderingImmediate(): void {
    if (this.isRendering) {
      this.isRendering = false;
      this.callbacks.onStop();
    }
  }

  private clearStopTimer(): void {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  public destroy(): void {
    this.clearStopTimer();
    this.stopRenderingImmediate();
  }
}
