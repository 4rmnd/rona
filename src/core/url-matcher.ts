/**
 * URL Gating for Rona (FR-01)
 * Restricts extension activation exclusively to standard YouTube watch pages with a valid video id parameter.
 * Rejects YouTube Shorts, Music, embeds, search, home, feeds, and non-YouTube domains.
 */

export function isSupportedYouTubeWatchUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    const url = new URL(urlString);

    // Host must strictly be standard YouTube
    const allowedHosts = ['www.youtube.com', 'youtube.com', 'm.youtube.com'];
    if (!allowedHosts.includes(url.hostname.toLowerCase())) {
      return false;
    }

    // Path must strictly be /watch
    if (url.pathname !== '/watch') {
      return false;
    }

    // Must have a non-empty video ID ('v') parameter
    const videoId = url.searchParams.get('v');
    if (!videoId || videoId.trim().length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
