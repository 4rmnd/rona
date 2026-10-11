import { describe, it, expect } from 'vitest';

export function isShortcutTriggered(
  e: {
    altKey: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    key?: string;
    code?: string;
  },
  target?: { tagName: string; isContentEditable?: boolean; closest?: (sel: string) => Element | null } | null
): boolean {
  if (e.ctrlKey || e.metaKey || !e.altKey) {
    return false;
  }

  const keyLower = e.key ? e.key.toLowerCase() : '';
  const isR = keyLower === 'r' || e.code === 'KeyR';
  const isA = keyLower === 'a' || e.code === 'KeyA';

  if (!isR && !isA) {
    return false;
  }

  if (target) {
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      Boolean(target.isContentEditable) ||
      (typeof target.closest === 'function' && target.closest('input, textarea, [contenteditable="true"]'))
    ) {
      return false;
    }
  }

  return true;
}

describe('Keyboard Shortcut: Flexible and Conflict-Free Detection', () => {
  it('triggers on Alt+Shift+R with KeyR code', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        code: 'KeyR'
      })
    ).toBe(true);
  });

  it('triggers on Alt+R (Windows IME collision-free shortcut)', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: false,
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

  it('triggers on Alt+R with lowercase r key', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: false,
        key: 'r'
      })
    ).toBe(true);
  });

  it('triggers on Alt+A and Alt+Shift+A (Ambient shortcut alternative)', () => {
    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: false,
        code: 'KeyA'
      })
    ).toBe(true);

    expect(
      isShortcutTriggered({
        altKey: true,
        shiftKey: true,
        key: 'a'
      })
    ).toBe(true);
  });

  it('rejects when Ctrl or Meta (Command/Windows key) is held', () => {
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
        shiftKey: false,
        metaKey: true,
        code: 'KeyR'
      })
    ).toBe(false);
  });

  it('rejects when Alt is not held', () => {
    expect(
      isShortcutTriggered({
        altKey: false,
        shiftKey: true,
        code: 'KeyR'
      })
    ).toBe(false);
  });

  it('does not trigger when focused on input, textarea, or contentEditable', () => {
    const inputTarget = { tagName: 'INPUT', isContentEditable: false, closest: () => null };
    const textareaTarget = { tagName: 'TEXTAREA', isContentEditable: false, closest: () => null };
    const editableTarget = { tagName: 'DIV', isContentEditable: true, closest: () => null };
    const regularTarget = { tagName: 'DIV', isContentEditable: false, closest: () => null };

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, inputTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: false, code: 'KeyR' }, textareaTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: true, code: 'KeyR' }, editableTarget)
    ).toBe(false);

    expect(
      isShortcutTriggered({ altKey: true, shiftKey: false, code: 'KeyR' }, regularTarget)
    ).toBe(true);
  });
});
