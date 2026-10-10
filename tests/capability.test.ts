import { describe, it, expect } from 'vitest';
import { checkRenderingCapability, handleCapabilityFailure } from '../src/core/capability';

describe('FR-12: Unsupported Graphics / Rendering Fallback', () => {
  it('detects available 2D canvas capability in supported environments', () => {
    const mockContext = {} as CanvasRenderingContext2D;
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext)
    } as unknown as HTMLCanvasElement;

    const result = checkRenderingCapability(mockCanvas);
    expect(result.supported).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('detects unsupported environment when getContext returns null', () => {
    const mockCanvas = {
      getContext: () => null
    } as unknown as HTMLCanvasElement;

    const result = checkRenderingCapability(mockCanvas);
    expect(result.supported).toBe(false);
    expect(result.reason).toContain('Canvas 2D context is not available');
  });

  it('handles thrown exceptions during context initialization gracefully', () => {
    const throwingCanvas = {
      getContext: () => {
        throw new Error('GPU context initialization crashed');
      }
    } as unknown as HTMLCanvasElement;

    const result = checkRenderingCapability(throwingCanvas);
    expect(result.supported).toBe(false);
    expect(result.reason).toContain('GPU context initialization crashed');
  });

  it('generates safe user-facing explanation without altering YouTube video', () => {
    const failureState = handleCapabilityFailure('Canvas context lost');
    expect(failureState.effectEnabled).toBe(false);
    expect(failureState.errorMessage).toContain('Rendering capability unavailable');
    expect(failureState.troubleshootingAction).toContain('hardware acceleration');
  });
});
