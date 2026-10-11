/**
 * Popup Logic for Rona
 * Connects UI controls to extension storage and live tab engine.
 */

import { loadStoredSettings, saveStoredSettings, type RonaProfile } from '../core/settings';

const masterToggle = document.getElementById('master-toggle') as HTMLInputElement;
const statusPulse = document.getElementById('status-pulse') as HTMLElement;
const statusTier = document.getElementById('status-tier') as HTMLElement;
const openSettingsBtn = document.getElementById('open-settings-btn') as HTMLButtonElement;

const profileButtons: Record<RonaProfile, HTMLButtonElement> = {
  eco: document.getElementById('btn-profile-eco') as HTMLButtonElement,
  balanced: document.getElementById('btn-profile-balanced') as HTMLButtonElement,
  cinematic: document.getElementById('btn-profile-cinematic') as HTMLButtonElement
};

async function initPopup(): Promise<void> {
  const settings = await loadStoredSettings();

  // Initialize controls
  masterToggle.checked = settings.enabled;
  updateProfileButtons(settings.profile);
  updateStatusDisplay(settings.enabled, settings.profile, settings.adaptiveMode, false);

  // Poll active tab for real-time adaptive status
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'RONA_GET_STATUS' }, (response) => {
        if (chrome.runtime.lastError || !response?.status) {
          return;
        }
        const st = response.status;
        updateStatusDisplay(
          settings.enabled,
          st.activeTier,
          st.adaptiveEnabled,
          st.isRenderingActive
        );
      });
    }
  } catch {
    // Non-watch tab or not loaded yet
  }

  // Synchronize UI if settings change externally (e.g. keyboard shortcut or options)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.rona_settings_v1?.newValue) {
      const updated = changes.rona_settings_v1.newValue;
      masterToggle.checked = updated.enabled;
      updateProfileButtons(updated.profile);
      updateStatusDisplay(updated.enabled, updated.profile, updated.adaptiveMode, updated.enabled);
    }
  });


  // Master toggle handler
  masterToggle.addEventListener('change', async () => {
    const isEnabled = masterToggle.checked;
    await saveStoredSettings({ enabled: isEnabled });
    updateStatusDisplay(isEnabled, settings.profile, settings.adaptiveMode, isEnabled);
  });

  // Profile buttons handler
  (['eco', 'balanced', 'cinematic'] as RonaProfile[]).forEach((prof) => {
    const btn = profileButtons[prof];
    if (btn) {
      btn.addEventListener('click', async () => {
        updateProfileButtons(prof);
        await saveStoredSettings({ profile: prof });
        updateStatusDisplay(masterToggle.checked, prof, settings.adaptiveMode, masterToggle.checked);
      });
    }
  });

  // Settings page open
  openSettingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/index.html'));
    }
  });
}

function updateProfileButtons(selectedProfile: RonaProfile): void {
  (['eco', 'balanced', 'cinematic'] as RonaProfile[]).forEach((prof) => {
    const btn = profileButtons[prof];
    if (btn) {
      btn.classList.toggle('active', prof === selectedProfile);
    }
  });
}

function updateStatusDisplay(
  enabled: boolean,
  tier: RonaProfile,
  adaptive: boolean,
  isRendering: boolean
): void {
  if (!enabled) {
    statusPulse.classList.remove('active');
    statusTier.textContent = 'Disabled';
    statusTier.style.color = '#9ca3af';
    return;
  }

  statusPulse.classList.toggle('active', isRendering);
  const capitalizedTier = tier.charAt(0).toUpperCase() + tier.slice(1);
  const prefix = adaptive ? 'Adaptive' : 'Fixed';
  statusTier.textContent = `${prefix} · ${capitalizedTier}`;
  statusTier.style.color = '#f3f4f6';
}

document.addEventListener('DOMContentLoaded', initPopup);
