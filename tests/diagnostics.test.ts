import { describe, it, expect } from 'vitest';
import { formatDiagnostics, type DiagnosticsInput } from '../src/core/diagnostics';

describe('FR-10: Advanced Diagnostics Panel Formatting', () => {
  it('formats verified runtime metrics truthfully', () => {
    const input: DiagnosticsInput = {
      selectedProfile: 'balanced',
      activeTier: 'balanced',
      adaptiveEnabled: true,
      fpsCap: 24,
      internalWidth: 480,
      internalHeight: 270,
      isRenderingActive: true
    };

    const formatted = formatDiagnostics(input);

    expect(formatted.profileDisplay).toBe('Balanced');
    expect(formatted.tierDisplay).toBe('Adaptive · Balanced');
    expect(formatted.fpsDisplay).toBe('24 FPS');
    expect(formatted.resolutionDisplay).toBe('480 × 270');
    expect(formatted.statusDisplay).toBe('Active');
  });

  it('displays Non-Adaptive state when adaptiveMode is disabled', () => {
    const input: DiagnosticsInput = {
      selectedProfile: 'cinematic',
      activeTier: 'cinematic',
      adaptiveEnabled: false,
      fpsCap: 30,
      internalWidth: 640,
      internalHeight: 360,
      isRenderingActive: true
    };

    const formatted = formatDiagnostics(input);
    expect(formatted.tierDisplay).toBe('Fixed · Cinematic');
  });

  it('strictly excludes fake total RAM or system memory statistics', () => {
    const input: DiagnosticsInput = {
      selectedProfile: 'eco',
      activeTier: 'eco',
      adaptiveEnabled: true,
      fpsCap: 15,
      internalWidth: 320,
      internalHeight: 180,
      isRenderingActive: false
    };

    const formatted = formatDiagnostics(input);
    const serialized = JSON.stringify(formatted).toLowerCase();

    // Must NEVER claim system RAM or total browser memory
    expect(serialized).not.toContain('total ram');
    expect(serialized).not.toContain('system ram');
    expect(serialized).not.toContain('browser memory');
    expect(serialized).not.toContain('gb ram');
    expect(formatted.statusDisplay).toBe('Idle / Paused');
  });
});
