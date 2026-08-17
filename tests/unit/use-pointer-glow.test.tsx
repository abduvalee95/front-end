// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePointerGlow } from '@/hooks/usePointerGlow';

/**
 * Sidebar cursor glow.
 *
 * The decorative part of this is not worth a test; the two guards are. A glow
 * that chases the cursor is exactly what someone who set "reduce motion" asked
 * not to see, and on a touch screen there is no cursor for it to chase — in
 * both cases the hook must attach nothing at all, rather than attach and then
 * decline to paint.
 */
type MediaMatches = { reducedMotion: boolean; finePointer: boolean };

function stubMatchMedia({ reducedMotion, finePointer }: MediaMatches) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : finePointer,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Render the hook with its ref already attached to a real element. */
function renderAttached() {
  const el = document.createElement('aside');
  document.body.appendChild(el);
  const add = vi.spyOn(el, 'addEventListener');
  const remove = vi.spyOn(el, 'removeEventListener');

  const { unmount } = renderHook(() => {
    const ref = usePointerGlow<HTMLElement>();
    // renderHook gives no DOM to attach to, so stand in for React's ref commit
    // before effects run.
    (ref as { current: HTMLElement | null }).current = el;
    return ref;
  });

  return { el, add, remove, unmount };
}

const ORIGINAL_MATCH_MEDIA = window.matchMedia;

afterEach(() => {
  window.matchMedia = ORIGINAL_MATCH_MEDIA;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('usePointerGlow', () => {
  beforeEach(() => {
    stubMatchMedia({ reducedMotion: false, finePointer: true });
  });

  it('tracks the pointer as CSS custom properties on a fine pointer', async () => {
    const { el } = renderAttached();

    el.dispatchEvent(new MouseEvent('pointerenter'));
    expect(el.style.getPropertyValue('--glow-opacity')).toBe('1');

    el.dispatchEvent(new MouseEvent('pointermove', { clientX: 120, clientY: 340 }));
    // The write is coalesced into a frame, so wait for one.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(el.style.getPropertyValue('--glow-x')).toBe('120px');
    expect(el.style.getPropertyValue('--glow-y')).toBe('340px');

    el.dispatchEvent(new MouseEvent('pointerleave'));
    expect(el.style.getPropertyValue('--glow-opacity')).toBe('0');
  });

  it('coalesces a burst of moves into a single write per frame', async () => {
    const { el } = renderAttached();
    const setProperty = vi.spyOn(el.style, 'setProperty');

    for (let i = 0; i < 20; i += 1) {
      el.dispatchEvent(new MouseEvent('pointermove', { clientX: i, clientY: i }));
    }
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    // Two properties, written once — not twenty times each.
    expect(setProperty).toHaveBeenCalledTimes(2);
    expect(el.style.getPropertyValue('--glow-x')).toBe('19px');
  });

  it('attaches nothing when the user asked for reduced motion', () => {
    stubMatchMedia({ reducedMotion: true, finePointer: true });
    const { add } = renderAttached();
    expect(add).not.toHaveBeenCalled();
  });

  it('attaches nothing on a coarse pointer, where there is no cursor to follow', () => {
    stubMatchMedia({ reducedMotion: false, finePointer: false });
    const { add } = renderAttached();
    expect(add).not.toHaveBeenCalled();
  });

  it('removes its listeners on unmount', () => {
    const { remove, unmount } = renderAttached();
    unmount();
    expect(remove).toHaveBeenCalledTimes(3);
  });
});
