/**
 * Diagnostics Panel Formatter for Rona (FR-10)
 * Honest, verified metrics only. Never claims system RAM or total browser memory.
 */

import { PROFILE_CONFIGS, type RonaProfile } from './settings';

export interface DiagnosticsInput {
  selectedProfile: RonaProfile;
  activeTier: RonaProfile;
  adaptiveEnabled: boolean;
  fpsCap: number;
  internalWidth: number;
  internalHeight: number;
  isRenderingActive: boolean;
}

export interface DiagnosticsFormatted {
  profileDisplay: string;
  tierDisplay: string;
  fpsDisplay: string;
  resolutionDisplay: string;
  statusDisplay: string;
}

export function formatDiagnostics(input: DiagnosticsInput): DiagnosticsFormatted {
  const profileConfig = PROFILE_CONFIGS[input.selectedProfile];
  const tierConfig = PROFILE_CONFIGS[input.activeTier];

  const profileDisplay = profileConfig ? profileConfig.label : input.selectedProfile;
  const tierPrefix = input.adaptiveEnabled ? 'Adaptive' : 'Fixed';
  const tierDisplay = `${tierPrefix} · ${tierConfig ? tierConfig.label : input.activeTier}`;
  const fpsDisplay = `${input.fpsCap} FPS`;
  const resolutionDisplay = `${input.internalWidth} × ${input.internalHeight}`;
  const statusDisplay = input.isRenderingActive ? 'Active' : 'Idle / Paused';

  return {
    profileDisplay,
    tierDisplay,
    fpsDisplay,
    resolutionDisplay,
    statusDisplay
  };
}
