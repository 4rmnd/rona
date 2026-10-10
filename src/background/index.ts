/**
 * Background Service Worker for Rona (MV3)
 * Handles keyboard commands (Alt+Shift+R toggle) and storage coordination.
 * Zero network requests. Zero telemetry.
 */

import { loadStoredSettings, saveStoredSettings } from '../core/settings';

// Listen for keyboard command: toggle-rona (Alt+Shift+R)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-rona') {
    const settings = await loadStoredSettings();
    const updated = await saveStoredSettings({ enabled: !settings.enabled });

    // Notify active YouTube watch tab
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id && activeTab.url?.includes('youtube.com/watch')) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'RONA_SETTINGS_CHANGED',
          settings: updated
        }).catch(() => {
          // Tab might not be ready or injected yet
        });
      }
    } catch {
      // Tab query error fallback
    }
  }
});

// Broadcast settings change when storage updates
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.rona_settings_v1) {
    const newSettings = changes.rona_settings_v1.newValue;
    chrome.tabs.query({ url: '*://www.youtube.com/watch*' }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'RONA_SETTINGS_CHANGED',
            settings: newSettings
          }).catch(() => {});
        }
      }
    });
  }
});
