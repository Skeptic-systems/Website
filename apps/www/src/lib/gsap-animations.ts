"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const gsapSectionConfig = {
  triggerStart: "top 80%",
  ease: "power3.out",
} as const;

export type GsapSectionSetup<T extends HTMLElement> = (context: {
  node: T;
  gsap: typeof gsap;
}) => void;

let isScrollTriggerRegistered = false;

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const ensureScrollTrigger = (): void => {
  if (isScrollTriggerRegistered) {
    return;
  }
  if (typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  isScrollTriggerRegistered = true;
};

export function useGsapSection<T extends HTMLElement>(
  setup: GsapSectionSetup<T>,
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) {
      return;
    }
    ensureScrollTrigger();

    const context = gsap.context(() => {
      setup({ node, gsap });
    }, node);

    return () => {
      context.revert();
    };
  }, [setup]);

  return ref;
}


