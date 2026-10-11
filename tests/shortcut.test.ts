import { describe, it, expect } from 'vitest';

export function isShortcutTriggered(
  e: {
    altKey: boolean;
    shiftKey: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    key?: string;
    code?: string;
  },
  target?: { tagName: string; isContentEditable?: boolean } | null
): boolean {
  const isR = e.key === 'r' || e.key === 'R' || e.code === 'KeyR';
  if (!e.altKey || !e.shiftKey || !isR || e.ctrlKey || e.metaKey) {
    return false;
  }

  if (target) {
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      Boolean(target.isContentEditable)
    ) {
      return false;
    }
  }

  return true;
}

describe('Keyboard Shortcut: Alt+Shift+R Detection', () => {
  it('triggers on Alt+Shift+R with KeyR code', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        code: 'KeyR'
      })
    ).toBe(true);
  });

  it('triggers on Alt+Shift+R with lowercase r key', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        key: 'r'
      })
    ).toBe(true);
  });

  it('triggers on Alt+Shift+R with uppercase R key', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        key: 'R'
      })
    ).toBe(true);
  });

  it('rejects when Ctrl or Meta (Command/Windows key) is also held', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        ctrlKey: true,
        code: 'KeyR'
      })
    ).toBe(false);

    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        metaKey: true,
        code: 'KeyR'
      })
    ).toBe(false);
  });

  it('rejects when only Alt or only Shift is held', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: false,
        code: 'KeyR'
      })
    ).toBe(false);

    expect(
      isShortcutTriggered({
        altKey: false,
        shiftKey: true,
        code: 'KeyR'
      })
    ).toBe(false);
  });

  it('does not trigger when focused on input, textarea, or contentEditable', () => {
    const inputTarget = { tagName: 'INPUT', isContentEditable: false };
    const textareaTarget = { tagName: 'TEXTAREA', isContentEditable: false };
    const editableTarget = { tagName: 'DIV', isContentEditable: true };
    const regularTarget = { tagName: 'DIV', isContentEditable: false };

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, inputTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, textareaTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, editableTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, regularTarget)
    ).toBe(true);
  });
});
