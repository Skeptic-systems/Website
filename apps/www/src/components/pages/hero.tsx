"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";

export function Hero() {
  const t = useTranslations("hero");
  const title = t("title");
  const headingRef = useRef<HTMLHeadingElement>(null);

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

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 w-full px-4 sm:px-8 -mt-20 sm:-mt-28 md:-mt-40">
        <h1
          ref={headingRef}
          className={`mx-auto max-w-[min(90vw,70rem)] text-center font-black leading-[1.05] tracking-tight text-balance pb-[0.08em]`}
          aria-label={title}
        >
          {wordEntries.map((entry, wordIdx) => (
            <div key={entry.key} className={`overflow-hidden`}>
              <span
                className={`block align-baseline whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-white text-[clamp(5rem,20vw,6rem)] sm:text-[6.5rem] md:text-[7.5rem] lg:text-[8.5rem] xl:text-[9.5rem] 2xl:text-[11rem] ${wordIdx === 0 ? "mb-1 sm:mb-2" : "leading-[1.2] pb-[0.22em] text-stroke-hero"}`}
              >
                {entry.letters.map((letter) => (
                  <span
                    key={letter.key}
                    className="inline-block char will-change-transform leading-[1.15] pt-[0.12em] -mt-[0.12em] pb-[0.18em] -mb-[0.18em] px-[0.08em] -mx-[0.08em] text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-white"
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </h1>
      </div>
    </section>
  );
}


