/**
 * Rendering Capability and Graceful Fallback for Rona (FR-12)
 * Validates canvas rendering contexts and handles unsupported configurations safely.
 */

export interface CapabilityCheckResult {
  supported: boolean;
  reason: string | null;
}

export interface CapabilityFailureState {
  effectEnabled: boolean;
  errorMessage: string;
  troubleshootingAction: string;
}

export function checkRenderingCapability(canvas: HTMLCanvasElement): CapabilityCheckResult {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return {
      supported: false,
      reason: 'HTMLCanvasElement or getContext is not available in this environment'
    };
  }

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        supported: false,
        reason: 'Canvas 2D context is not available or disabled by browser flags'
      };
    }
    return {
      supported: true,
      reason: null
    };
  } catch (error: any) {
    return {
      supported: false,
      reason: error?.message || 'Unknown error while creating canvas rendering context'
    };
  }
}

export function handleCapabilityFailure(reason: string): CapabilityFailureState {
  return {
    effectEnabled: false,
    errorMessage: `Rendering capability unavailable: ${reason}. Rona ambient light is safely disabled for this tab.`,
    troubleshootingAction: 'Please check that hardware acceleration is enabled in your browser settings (chrome://settings/system).'
  };
}
