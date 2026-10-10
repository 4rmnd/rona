import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  PROFILE_CONFIGS,
  validateAndSanitizeSettings,
  type RonaSettings
} from '../src/core/settings';

describe('FR-03, FR-05, FR-07: Settings and Profiles Model', () => {
  it('supplies default settings matching PRD specifications', () => {
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
    expect(DEFAULT_SETTINGS.profile).toBe('balanced');
    expect(DEFAULT_SETTINGS.adaptiveMode).toBe(true);
    expect(DEFAULT_SETTINGS.intensity).toBe(100);
    expect(DEFAULT_SETTINGS.blur).toBe(40);
    expect(DEFAULT_SETTINGS.spread).toBe(30);
    expect(DEFAULT_SETTINGS.fade).toBe(20);
    expect(DEFAULT_SETTINGS.direction).toBe('all');
    expect(DEFAULT_SETTINGS.showDiagnostics).toBe(false);
  });

  it('provides exact resolution and FPS targets per profile', () => {
    expect(PROFILE_CONFIGS.eco).toEqual({
      name: 'eco',
      label: 'Eco',
      maxResolution: { width: 320, height: 180 },
      maxFps: 15
    });

    expect(PROFILE_CONFIGS.balanced).toEqual({
      name: 'balanced',
      label: 'Balanced',
      maxResolution: { width: 480, height: 270 },
      maxFps: 24
    });

    expect(PROFILE_CONFIGS.cinematic).toEqual({
      name: 'cinematic',
      label: 'Cinematic',
      maxResolution: { width: 640, height: 360 },
      maxFps: 30
    });
  });

  it('sanitizes invalid or out-of-bounds input values', () => {
    const raw: Partial<RonaSettings> = {
      intensity: 150, // exceeds max 100
      blur: -20,      // below min 0
      spread: 999,
      fade: -10,
      profile: 'ultra-super' as any, // invalid profile
      direction: 'diagonal' as any  // invalid direction
    };

    const sanitized = validateAndSanitizeSettings(raw);

    expect(sanitized.intensity).toBe(100);
    expect(sanitized.blur).toBe(0);
    expect(sanitized.spread).toBe(100);
    expect(sanitized.fade).toBe(0);
    expect(sanitized.profile).toBe('balanced');
    expect(sanitized.direction).toBe('all');
  });

  it('preserves valid custom settings', () => {
    const custom: Partial<RonaSettings> = {
      enabled: false,
      profile: 'eco',
      adaptiveMode: false,
      intensity: 75,
      blur: 50,
      spread: 25,
      fade: 15,
      direction: 'top',
      showDiagnostics: true
    };

    const sanitized = validateAndSanitizeSettings(custom);
    expect(sanitized).toMatchObject(custom);
  });

  it('handles chrome.storage.local load and save seamlessly', async () => {
    const storageStore: Record<string, any> = {};
    (globalThis as any).chrome = {
      storage: {
        local: {
          get: vi.fn().mockImplementation((key: string) => Promise.resolve({ [key]: storageStore[key] })),
          set: vi.fn().mockImplementation((items: Record<string, any>) => {
            Object.assign(storageStore, items);
            return Promise.resolve();
          })
        }
      }
    };

    const { loadStoredSettings, saveStoredSettings } = await import('../src/core/settings');

    const initial = await loadStoredSettings();
    expect(initial.profile).toBe('balanced');

    const updated = await saveStoredSettings({ profile: 'cinematic', intensity: 80 });
    expect(updated.profile).toBe('cinematic');
    expect(updated.intensity).toBe(80);

    const reloaded = await loadStoredSettings();
    expect(reloaded.profile).toBe('cinematic');
    expect(reloaded.intensity).toBe(80);
  });
});
