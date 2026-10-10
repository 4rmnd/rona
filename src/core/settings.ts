/**
 * Settings and Profiles Model for Rona (FR-03, FR-05, FR-07)
 */

export type RonaProfile = 'eco' | 'balanced' | 'cinematic';
export type RonaDirection = 'all' | 'top' | 'sides' | 'bottom';

export interface Resolution {
  width: number;
  height: number;
}

export interface ProfileConfig {
  name: RonaProfile;
  label: string;
  maxResolution: Resolution;
  maxFps: number;
}

export const PROFILE_CONFIGS: Record<RonaProfile, ProfileConfig> = {
  eco: {
    name: 'eco',
    label: 'Eco',
    maxResolution: { width: 320, height: 180 },
    maxFps: 15
  },
  balanced: {
    name: 'balanced',
    label: 'Balanced',
    maxResolution: { width: 480, height: 270 },
    maxFps: 24
  },
  cinematic: {
    name: 'cinematic',
    label: 'Cinematic',
    maxResolution: { width: 640, height: 360 },
    maxFps: 30
  }
};

export interface RonaSettings {
  enabled: boolean;
  profile: RonaProfile;
  adaptiveMode: boolean;
  intensity: number; // 0 - 100
  blur: number;      // 0 - 100
  spread: number;    // 0 - 100
  fade: number;      // 0 - 100
  direction: RonaDirection;
  showDiagnostics: boolean;
}

export const DEFAULT_SETTINGS: Readonly<RonaSettings> = {
  enabled: true,
  profile: 'balanced',
  adaptiveMode: true,
  intensity: 100,
  blur: 40,
  spread: 30,
  fade: 20,
  direction: 'all',
  showDiagnostics: false
};

const VALID_PROFILES: RonaProfile[] = ['eco', 'balanced', 'cinematic'];
const VALID_DIRECTIONS: RonaDirection[] = ['all', 'top', 'sides', 'bottom'];

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function validateAndSanitizeSettings(raw?: Partial<RonaSettings> | null): RonaSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SETTINGS.enabled;
  const profile: RonaProfile =
    raw.profile && VALID_PROFILES.includes(raw.profile) ? raw.profile : DEFAULT_SETTINGS.profile;
  const adaptiveMode =
    typeof raw.adaptiveMode === 'boolean' ? raw.adaptiveMode : DEFAULT_SETTINGS.adaptiveMode;
  const intensity = clamp(raw.intensity, 0, 100, DEFAULT_SETTINGS.intensity);
  const blur = clamp(raw.blur, 0, 100, DEFAULT_SETTINGS.blur);
  const spread = clamp(raw.spread, 0, 100, DEFAULT_SETTINGS.spread);
  const fade = clamp(raw.fade, 0, 100, DEFAULT_SETTINGS.fade);
  const direction: RonaDirection =
    raw.direction && VALID_DIRECTIONS.includes(raw.direction)
      ? raw.direction
      : DEFAULT_SETTINGS.direction;
  const showDiagnostics =
    typeof raw.showDiagnostics === 'boolean'
      ? raw.showDiagnostics
      : DEFAULT_SETTINGS.showDiagnostics;

  return {
    enabled,
    profile,
    adaptiveMode,
    intensity,
    blur,
    spread,
    fade,
    direction,
    showDiagnostics
  };
}

export const STORAGE_KEY = 'rona_settings_v1';

export async function loadStoredSettings(): Promise<RonaSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      return validateAndSanitizeSettings(data[STORAGE_KEY]);
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveStoredSettings(settings: Partial<RonaSettings>): Promise<RonaSettings> {
  const current = await loadStoredSettings();
  const updated = validateAndSanitizeSettings({ ...current, ...settings });
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    } catch {
      // Storage error fallback
    }
  }
  return updated;
}
