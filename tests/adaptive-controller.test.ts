import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveController } from '../src/core/adaptive-controller';
import { PROFILE_CONFIGS } from '../src/core/settings';

describe('FR-06, FR-07: Adaptive Resource Mode Controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts at the cap of the user-selected profile', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'cinematic',
      adaptiveEnabled: true
    });

    const state = controller.getState();
    expect(state.activeTier).toBe('cinematic');
    expect(state.effectiveFps).toBe(30);
    expect(state.effectiveResolution).toEqual({ width: 640, height: 360 });
  });

  it('never upgrades beyond the selected profile even with zero dropped frames', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'balanced',
      adaptiveEnabled: true
    });

    // Run for 60 seconds with perfect playback
    for (let i = 0; i < 60; i++) {
      controller.recordSample({ droppedFramesDelta: 0, frameDurationMs: 8 });
      vi.advanceTimersByTime(1000);
    }

    const state = controller.getState();
    expect(state.activeTier).toBe('balanced');
    expect(state.effectiveFps).toBe(24);
    expect(state.effectiveResolution).toEqual({ width: 480, height: 270 });
  });

  it('steps down tier within 3 seconds when dropped frames spike in rolling 5s window', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'cinematic',
      adaptiveEnabled: true
    });

    expect(controller.getState().activeTier).toBe('cinematic');

    // Introduce significant dropped frames spike
    controller.recordSample({ droppedFramesDelta: 12, frameDurationMs: 35 });
    vi.advanceTimersByTime(2000); // 2 seconds

    controller.recordSample({ droppedFramesDelta: 8, frameDurationMs: 40 });
    vi.advanceTimersByTime(1000); // 3 seconds total

    const state = controller.getState();
    expect(state.activeTier).toBe('balanced');
    expect(state.effectiveFps).toBe(24);
    expect(state.effectiveResolution).toEqual({ width: 480, height: 270 });
  });

  it('steps down from balanced to eco under sustained pressure', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'balanced',
      adaptiveEnabled: true
    });

    expect(controller.getState().activeTier).toBe('balanced');

    controller.recordSample({ droppedFramesDelta: 15, frameDurationMs: 45 });
    vi.advanceTimersByTime(3000);

    const state = controller.getState();
    expect(state.activeTier).toBe('eco');
    expect(state.effectiveFps).toBe(15);
    expect(state.effectiveResolution).toEqual({ width: 320, height: 180 });
  });

  it('recovers one tier only after sustained stability of 30 seconds', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'cinematic',
      adaptiveEnabled: true
    });

    // Downgrade to balanced
    controller.recordSample({ droppedFramesDelta: 15, frameDurationMs: 45 });
    vi.advanceTimersByTime(3000);
    expect(controller.getState().activeTier).toBe('balanced');

    // 25 seconds of stable playback (not yet 30s)
    for (let i = 0; i < 25; i++) {
      controller.recordSample({ droppedFramesDelta: 0, frameDurationMs: 10 });
      vi.advanceTimersByTime(1000);
    }
    expect(controller.getState().activeTier).toBe('balanced');

    // 5 more seconds (reaches 30s)
    for (let i = 0; i < 5; i++) {
      controller.recordSample({ droppedFramesDelta: 0, frameDurationMs: 10 });
      vi.advanceTimersByTime(1000);
    }
    expect(controller.getState().activeTier).toBe('cinematic');
  });

  it('bypasses adaptive tiers when adaptiveMode is disabled', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'cinematic',
      adaptiveEnabled: false
    });

    // Heavy dropped frames
    controller.recordSample({ droppedFramesDelta: 50, frameDurationMs: 80 });
    vi.advanceTimersByTime(5000);

    // Stays at cinematic because adaptive mode is off
    const state = controller.getState();
    expect(state.activeTier).toBe('cinematic');
    expect(state.effectiveFps).toBe(30);
  });

  it('updates runtime configuration dynamically and caps current tier when user downgrades', () => {
    const controller = new AdaptiveController({
      selectedProfile: 'cinematic',
      adaptiveEnabled: true
    });

    expect(controller.getState().activeTier).toBe('cinematic');

    // Downgrade user setting to eco
    controller.updateConfig({ selectedProfile: 'eco' });
    expect(controller.getState().activeTier).toBe('eco');

    // Disable adaptive mode
    controller.updateConfig({ adaptiveEnabled: false, selectedProfile: 'balanced' });
    expect(controller.getState().activeTier).toBe('balanced');
  });
});
