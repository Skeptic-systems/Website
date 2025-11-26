"use client";

import { useEffect, useState } from "react";

type SectionIntersectionOptions = {
  rootMargin?: string;
  threshold?: number | number[];
};

export function useSectionIntersection(
  sectionId: string,
  { rootMargin = "200px", threshold = 0 }: SectionIntersectionOptions = {},
): boolean {
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (hasIntersected) {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasIntersected(true);
            break;
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [sectionId, rootMargin, threshold, hasIntersected]);

  return hasIntersected;
}



