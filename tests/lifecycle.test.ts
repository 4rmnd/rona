import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LifecycleManager } from '../src/core/lifecycle-manager';

describe('FR-08: Inactive Lifecycle and Resource Cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('stops rendering and releases callbacks within 1 second of pause', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');
    expect(lifecycle.isRenderingActive()).toBe(true);

    lifecycle.setPlaybackState('paused');
    vi.advanceTimersByTime(1000); // 1 second

    expect(lifecycle.isRenderingActive()).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('stops rendering within 1 second when video ends', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');

    lifecycle.setPlaybackState('ended');
    vi.advanceTimersByTime(1000);

    expect(lifecycle.isRenderingActive()).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('stops rendering within 1 second when tab becomes hidden', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');

    lifecycle.setVisibilityState('hidden');
    vi.advanceTimersByTime(1000);

    expect(lifecycle.isRenderingActive()).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('resumes cleanly when tab becomes visible again while video is playing', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');
    lifecycle.setVisibilityState('hidden');
    vi.advanceTimersByTime(1000);

    expect(lifecycle.isRenderingActive()).toBe(false);

    lifecycle.setVisibilityState('visible');
    expect(lifecycle.isRenderingActive()).toBe(true);
    expect(onResume).toHaveBeenCalledTimes(2); // 1st on initial play, 2nd when unhidden
  });

  it('stops rendering immediately on SPA route transition and cleans up', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');

    lifecycle.handleSpaNavigationStart();
    expect(lifecycle.isRenderingActive()).toBe(false);
    expect(onStop).toHaveBeenCalled();
  });

  it('destroys lifecycle cleanly and clears pending timers', () => {
    const onStop = vi.fn();
    const onResume = vi.fn();

    const lifecycle = new LifecycleManager({ onStop, onResume });
    lifecycle.setPlaybackState('playing');
    lifecycle.setVisibilityState('hidden'); // Pending 1s timer

    lifecycle.destroy();
    expect(lifecycle.isRenderingActive()).toBe(false);
    expect(onStop).toHaveBeenCalled();
  });
});
