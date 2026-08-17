'use client';

import { useEffect, useRef } from 'react';

/**
 * Track the pointer inside an element and publish its position as CSS custom
 * properties (`--glow-x`, `--glow-y`, `--glow-opacity`), which
 * `.dashboard-sidebar::after` reads to paint a glow that follows the cursor.
 *
 * Deliberately written as direct style writes on a ref rather than React
 * state. `pointermove` fires far more often than the screen refreshes, and a
 * `setState` in that handler would re-render the entire sidebar — every nav
 * item, every icon — to move one gradient. Writing a custom property instead
 * keeps the work in the compositor and React never hears about it.
 */
export function usePointerGlow<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // A glow chasing the cursor has nothing to offer someone who asked for
    // less motion, and nothing to chase on a touch screen — there it would
    // just sit wherever the last tap landed. Skip attaching entirely in both
    // cases, so no listener runs at all.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const paint = () => {
      frame = 0;
      // The rect is read here rather than in the event handler so there is at
      // most one layout read per frame, and it stays correct as the sidebar
      // animates between its collapsed and expanded widths.
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--glow-x', `${clientX - rect.left}px`);
      el.style.setProperty('--glow-y', `${clientY - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onEnter = () => el.style.setProperty('--glow-opacity', '1');
    const onLeave = () => el.style.setProperty('--glow-opacity', '0');

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
