"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";

export function Hero() {
  const t = useTranslations("hero");
  const title = t("title");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wordCounts = new Map<string, number>();
  const wordEntries = title.split(" ").map((word) => {
    const charCounts = new Map<string, number>();
    const occurrences = wordCounts.get(word) ?? 0;
    wordCounts.set(word, occurrences + 1);
    const letters = word.split("").map((ch) => {
      const seen = charCounts.get(ch) ?? 0;
      charCounts.set(ch, seen + 1);
      return { char: ch, key: `${word}-${ch}-${seen}` };
    });
    return { word, key: `${word}-${occurrences}`, letters };
  });

  useEffect(() => {
    const node = headingRef.current;
    if (!node) return;
    const chars = node.querySelectorAll<HTMLElement>(".char");
    gsap.set(chars, { yPercent: 100, opacity: 0 });
    gsap.to(chars, {
      yPercent: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.035,
      delay: 0.15,
    });
  }, []);

  const primaryWordGradient =
    "bg-gradient-to-b from-[#4a4a55] via-[#2b2a33] to-[#09080d] dark:from-white dark:via-neutral-200 dark:to-white";
  const secondaryWordGradient =
    "bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 dark:from-white dark:via-neutral-200 dark:to-white";

  return (
    <section className="relative -mt-20 flex min-h-[calc(100vh+5rem)] w-full items-center justify-center bg-white pt-20 dark:bg-transparent">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#b9b9b9_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_0.6px,transparent_0.6px)]" />
      <div className="accent-glow-layer" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 w-full px-4 sm:px-8 -mt-20 sm:-mt-28 md:-mt-40">
        <h1
          ref={headingRef}
          className="mx-auto max-w-[min(90vw,70rem)] text-balance pb-[0.08em] text-center font-black leading-[1.05] tracking-tight"
          aria-label={title}
        >
          {wordEntries.map((entry, wordIdx) => (
            <div key={entry.key} className="overflow-hidden">
              <span
                className={`block align-baseline whitespace-nowrap text-transparent ${wordIdx === 0 ? primaryWordGradient : secondaryWordGradient} bg-clip-text text-[clamp(5rem,20vw,6rem)] sm:text-[6.5rem] md:text-[7.5rem] lg:text-[8.5rem] xl:text-[9.5rem] 2xl:text-[11rem] ${
                  wordIdx === 0 ? "mb-1 sm:mb-2" : "pb-[0.22em] leading-[1.2] text-stroke-hero"
                }`}
              >
                {entry.letters.map((letter) => (
                  <span
                    key={letter.key}
                    className={`char inline-block text-transparent bg-clip-text will-change-transform ${
                      wordIdx === 0 ? primaryWordGradient : secondaryWordGradient
                    } -mx-[0.08em] px-[0.08em] pt-[0.12em] pb-[0.18em] -mt-[0.12em] -mb-[0.18em] leading-[1.15]`}
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </h1>
      </div>

      <div
        className={`absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-700 sm:bottom-24 ${
          scrolled ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-neutral-400/60 p-1.5 dark:border-neutral-500/50 sm:h-12 sm:w-7">
          <div className="h-2 w-2 animate-scroll-bounce rounded-full bg-neutral-500 dark:bg-neutral-400 sm:h-2.5 sm:w-2.5" />
        </div>
        <span className="sr-only">{t("scrollHint")}</span>
      </div>
    </section>
  );
}


