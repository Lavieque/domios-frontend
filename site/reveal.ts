import { useEffect } from "react";

/**
 * Content rises into place as it scrolls into view, on every page. Blocks come in as one;
 * the items of a list come in one after another. Nothing is hidden without JavaScript: the
 * `reveal` class is only added here. When the visitor asks for less motion the stylesheet turns
 * the rise into a plain fade.
 */
const BLOCKS = [
  ".section-head",
  ".story-copy",
  ".story-row > .shot",
  ".story-scene",
  ".tour-layout",
  ".judge-copy",
  ".demo",
  ".close-inner",
  ".feature-group > h2",
  ".feature-layout",
  ".guide-toc",
  ".guide-step",
  ".request-layout > *",
  ".not-found-actions",
].join(",");

const ITEMS = [".points li", ".judge-list > div", ".feature-rows > li", ".guide-faq details", ".faq details", ".does-list > div"].join(",");

export function useReveal(pathname: string) {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      // Any part in view is enough: a block taller than the screen must still come in.
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    const content = document.getElementById("content");
    if (!content) return;
    const blocks = [...content.querySelectorAll<HTMLElement>(BLOCKS)];
    const items = [...content.querySelectorAll<HTMLElement>(ITEMS)];
    for (const item of items) {
      const index = [...(item.parentElement?.children ?? [])].indexOf(item);
      item.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 70}ms`);
    }
    for (const el of [...blocks, ...items]) {
      el.classList.add("reveal");
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      for (const el of [...blocks, ...items]) el.classList.remove("reveal", "is-in");
    };
  }, [pathname]);
}
