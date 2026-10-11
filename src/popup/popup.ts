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
  updateStatusDisplay(settings.enabled, settings.profile, settings.adaptiveMode, false, false, false);

  // Poll active tab for real-time adaptive status
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'RONA_GET_STATUS' }, (response) => {
        if (chrome.runtime.lastError || !response?.status) {
          // Tab is not a YouTube page or content script is standby
          updateStatusDisplay(settings.enabled, settings.profile, settings.adaptiveMode, false, false, false);
          return;
        }
        const st = response.status;
        updateStatusDisplay(
          settings.enabled,
          st.activeTier,
          st.adaptiveEnabled,
          st.isWatchPage ?? false,
          st.isRenderingActive ?? false,
          st.isPaused ?? false
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
      updateStatusDisplay(updated.enabled, updated.profile, updated.adaptiveMode, true, updated.enabled, false);
    }
  });

  // Master toggle handler
  masterToggle.addEventListener('change', async () => {
    const isEnabled = masterToggle.checked;
    await saveStoredSettings({ enabled: isEnabled });
    updateStatusDisplay(isEnabled, settings.profile, settings.adaptiveMode, true, isEnabled, false);
  });

  // Profile buttons handler
  (['eco', 'balanced', 'cinematic'] as RonaProfile[]).forEach((prof) => {
    const btn = profileButtons[prof];
    if (btn) {
      btn.addEventListener('click', async () => {
        updateProfileButtons(prof);
        await saveStoredSettings({ profile: prof });
        updateStatusDisplay(masterToggle.checked, prof, settings.adaptiveMode, true, masterToggle.checked, false);
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
  isWatchPage: boolean,
  isRendering: boolean,
  isPaused: boolean
): void {
  statusPulse.className = 'status-pulse';

  if (!enabled) {
    statusPulse.classList.add('disabled');
    statusTier.textContent = 'Disabled';
    statusTier.style.color = '#9ca3af';
    return;
  }

  // When user is browsing Home / Search / Feeds (not currently watching a video)
  if (!isWatchPage) {
    statusPulse.classList.add('standby');
    statusTier.textContent = 'Standby · Ready on Watch';
    statusTier.style.color = '#38bdf8';
    return;
  }

  // Active rendering during playback
  if (isRendering) {
    statusPulse.classList.add('active');
    const capitalizedTier = tier.charAt(0).toUpperCase() + tier.slice(1);
    const prefix = adaptive ? 'Adaptive' : 'Fixed';
    statusTier.textContent = `${prefix} · ${capitalizedTier}`;
    statusTier.style.color = '#10b981';
    return;
  }

  // Video paused on watch page
  if (isPaused) {
    statusPulse.classList.add('paused');
    statusTier.textContent = 'Paused · Ready';
    statusTier.style.color = '#fbbf24';
    return;
  }

  statusPulse.classList.add('standby');
  statusTier.textContent = 'Standby · Ready';
  statusTier.style.color = '#38bdf8';
}

document.addEventListener('DOMContentLoaded', initPopup);
