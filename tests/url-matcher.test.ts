import { describe, it, expect } from 'vitest';
import { isSupportedYouTubeWatchUrl } from '../src/core/url-matcher';

describe('FR-01: YouTube Watch Page URL Gating', () => {
  it('accepts standard YouTube watch pages with video query parameter', () => {
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(true);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/watch?v=xyz123&list=PL12345')).toBe(true);
  });

  it('rejects YouTube watch page without a video ID', () => {
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/watch')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/watch?')).toBe(false);
  });

  it('rejects YouTube home, search, channels, and feeds', () => {
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/feed/subscriptions')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/results?search_query=lofi')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/@YouTube')).toBe(false);
  });

  it('rejects YouTube Shorts, Music, and Embedded players', () => {
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(false);
  });

  it('rejects non-YouTube domains and invalid URLs', () => {
    expect(isSupportedYouTubeWatchUrl('https://vimeo.com/123456')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://twitch.tv/streamer')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('https://malicious-youtube.com/watch?v=abc')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('not-a-valid-url')).toBe(false);
    expect(isSupportedYouTubeWatchUrl('')).toBe(false);
  });
});
