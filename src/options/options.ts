/**
 * Options and Diagnostics Controller for Rona
 */

import {
  loadStoredSettings,
  saveStoredSettings,
  type RonaDirection,
  type RonaProfile,
  type RonaSettings
} from '../core/settings';
import { formatDiagnostics } from '../core/diagnostics';

// UI Elements
const inputIntensity = document.getElementById('input-intensity') as HTMLInputElement;
const valIntensity = document.getElementById('val-intensity') as HTMLElement;

const inputBlur = document.getElementById('input-blur') as HTMLInputElement;
const valBlur = document.getElementById('val-blur') as HTMLElement;

const inputSpread = document.getElementById('input-spread') as HTMLInputElement;
const valSpread = document.getElementById('val-spread') as HTMLElement;

const inputFade = document.getElementById('input-fade') as HTMLInputElement;
const valFade = document.getElementById('val-fade') as HTMLElement;

const selectDirection = document.getElementById('select-direction') as HTMLSelectElement;
const selectProfile = document.getElementById('select-profile') as HTMLSelectElement;
const toggleAdaptive = document.getElementById('toggle-adaptive') as HTMLInputElement;

// Diagnostics Display
const diagProfile = document.getElementById('diag-profile') as HTMLElement;
const diagTier = document.getElementById('diag-tier') as HTMLElement;
const diagFps = document.getElementById('diag-fps') as HTMLElement;
const diagResolution = document.getElementById('diag-resolution') as HTMLElement;

async function initOptions(): Promise<void> {
  const settings = await loadStoredSettings();
  populateUI(settings);
  attachListeners();
  refreshDiagnostics(settings);
}

function populateUI(settings: RonaSettings): void {
  inputIntensity.value = settings.intensity.toString();
  valIntensity.textContent = `${settings.intensity}%`;

  inputBlur.value = settings.blur.toString();
  valBlur.textContent = `${settings.blur}%`;

  inputSpread.value = settings.spread.toString();
  valSpread.textContent = `${settings.spread}%`;

  inputFade.value = settings.fade.toString();
  valFade.textContent = `${settings.fade}%`;

  selectDirection.value = settings.direction;
  selectProfile.value = settings.profile;
  toggleAdaptive.checked = settings.adaptiveMode;
}

function attachListeners(): void {
  const saveVisuals = async () => {
    const updated = await saveStoredSettings({
      intensity: Number(inputIntensity.value),
      blur: Number(inputBlur.value),
      spread: Number(inputSpread.value),
      fade: Number(inputFade.value),
      direction: selectDirection.value as RonaDirection
    });
    refreshDiagnostics(updated);
  };

  inputIntensity.addEventListener('input', () => {
    valIntensity.textContent = `${inputIntensity.value}%`;
    saveVisuals();
  });

  inputBlur.addEventListener('input', () => {
    valBlur.textContent = `${inputBlur.value}%`;
    saveVisuals();
  });

  inputSpread.addEventListener('input', () => {
    valSpread.textContent = `${inputSpread.value}%`;
    saveVisuals();
  });

  inputFade.addEventListener('input', () => {
    valFade.textContent = `${inputFade.value}%`;
    saveVisuals();
  });

  selectDirection.addEventListener('change', saveVisuals);

  selectProfile.addEventListener('change', async () => {
    const updated = await saveStoredSettings({
      profile: selectProfile.value as RonaProfile
    });
    refreshDiagnostics(updated);
  });

  toggleAdaptive.addEventListener('change', async () => {
    const updated = await saveStoredSettings({
      adaptiveMode: toggleAdaptive.checked
    });
    refreshDiagnostics(updated);
  });
}

function refreshDiagnostics(settings: RonaSettings): void {
  const profileDims: Record<RonaProfile, { w: number; h: number; fps: number }> = {
    eco: { w: 320, h: 180, fps: 15 },
    balanced: { w: 480, h: 270, fps: 24 },
    cinematic: { w: 640, h: 360, fps: 30 }
  };

  const currentDim = profileDims[settings.profile];

  const diag = formatDiagnostics({
    selectedProfile: settings.profile,
    activeTier: settings.profile,
    adaptiveEnabled: settings.adaptiveMode,
    fpsCap: currentDim.fps,
    internalWidth: currentDim.w,
    internalHeight: currentDim.h,
    isRenderingActive: settings.enabled
  });

  diagProfile.textContent = diag.profileDisplay;
  diagTier.textContent = diag.tierDisplay;
  diagFps.textContent = diag.fpsDisplay;
  diagResolution.textContent = diag.resolutionDisplay;
}

document.addEventListener('DOMContentLoaded', initOptions);
