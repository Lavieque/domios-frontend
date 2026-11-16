import { useEffect } from "react";

/**
 * Motion tied to the scroll, the same on a phone as on a computer: the thumb drives it.
 *
 * Each tracked element gets two numbers as CSS custom properties, and the stylesheet decides
 * what they move:
 * - `--p`: how far the element has travelled through the screen, 0 as its top meets the bottom
 *   edge, 1 as its bottom leaves the top edge (0.5 is roughly centred);
 * - `--exit`: how much of an element that starts on screen (the hero) has scrolled away, 0 to 1.
 *
 * Where there is no mouse (touch), the effects the mouse gives on a computer come from the
 * scroll instead: the light crosses each capture as it passes, and the row of an index that
 * sits in the middle of the screen takes its hover look.
 *
 * Nothing runs when the visitor asks for less motion; without JavaScript every property keeps
 * its resting default in the stylesheet.
 */
const TRACKED = [".hero", ".story-row > .shot", ".story-scene", ".page-head"].join(",");
const TOUCH_LIGHT = ".story-row .shot-frame, .tour-panel .shot-frame, .feature-layout .shot-frame";
const TOUCH_FOCUS = ".feature-row";

export function useScrollMotion(pathname: string) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const content = document.getElementById("content");
    if (!content) return;
    const touch = window.matchMedia("(hover: none)").matches;
    let frame = 0;

    function set(el: HTMLElement, name: string, value: number) {
      const text = value.toFixed(3);
      if (el.style.getPropertyValue(name) !== text) el.style.setProperty(name, text);
    }

    function update() {
      frame = 0;
      const vh = window.innerHeight;
      // Queried every frame: the tour swaps its capture, and the lists are short.
      for (const el of content!.querySelectorAll<HTMLElement>(TRACKED)) {
        const box = el.getBoundingClientRect();
        if (box.bottom < -vh || box.top > vh * 2) continue;
        set(el, "--p", clamp((vh - box.top) / (vh + box.height)));
        set(el, "--exit", clamp(-box.top / box.height));
      }
      if (!touch) return;
      for (const el of content!.querySelectorAll<HTMLElement>(TOUCH_LIGHT)) {
        const box = el.getBoundingClientRect();
        const p = clamp((vh - box.top) / (vh + box.height));
        const seen = box.bottom > 0 && box.top < vh;
        el.classList.toggle("is-lit", seen);
        if (seen) {
          set(el, "--px", 0.1 + p * 0.8);
          set(el, "--py", 0.25 + p * 0.3);
        }
      }
      for (const el of content!.querySelectorAll<HTMLElement>(TOUCH_FOCUS)) {
        const box = el.getBoundingClientRect();
        const middle = box.top + box.height / 2;
        el.classList.toggle("is-focus", middle > vh * 0.38 && middle < vh * 0.62);
      }
    }

    function request() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    // Images load late and move what is under them.
    const settle = window.setTimeout(request, 600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [pathname]);
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}
