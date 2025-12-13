"use client";

import { useEffect } from "react";

export function PathNormalizer() {
  useEffect(() => {
    try {
      const m = window.location.pathname.match(/^\/(en|de)(\/.*)?$/);
      if (m) {
        const rest = m[2] || "/";
        window.history.replaceState(null, "", rest);
      }
    } catch {
      // no-op
    }
  }, []);

  return null;
}


