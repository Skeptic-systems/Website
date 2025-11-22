"use client";

import { useEffect } from "react";

export function ScrollReset() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.hash.length > 0) {
      return;
    }

    let restoreScrollRestoration: (() => void) | null = null;
    if ("scrollRestoration" in window.history) {
      const previousRestoration = window.history.scrollRestoration;
      if (previousRestoration !== "manual") {
        window.history.scrollRestoration = "manual";
        restoreScrollRestoration = () => {
          window.history.scrollRestoration = previousRestoration;
        };
      }
    }

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0 });
    root.style.scrollBehavior = previousScrollBehavior;

    return () => {
      if (restoreScrollRestoration) {
        restoreScrollRestoration();
      }
    };
  }, []);

  return null;
}









