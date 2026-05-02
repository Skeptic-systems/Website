"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";

import { geist } from "@/app/fonts";

export function Hero() {
  const t = useTranslations("hero");
  const title = t("title");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
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

    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.9 },
      );
    }
  }, []);

  const primaryWordGradient =
    "bg-gradient-to-r from-[#D24444] via-[#a03498] to-[#7950F2]";
  const secondaryWordGradient =
    "bg-gradient-to-r from-[#7950F2] via-[#6040e0] to-[#4060f0]";

  return (
    <section className="relative -mt-20 flex min-h-[calc(100vh+5rem)] w-full items-center justify-center bg-transparent pt-20">
      <div className="absolute inset-0 [background-size:28px_28px] dark:[background-image:radial-gradient(#404040_0.6px,transparent_0.6px)]" />
      <div className="accent-glow-layer" />
      <div className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-black/80 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 w-full px-4 sm:px-8 -mt-20 sm:-mt-28 md:-mt-40">
        <h1
          ref={headingRef}
          className="mx-auto max-w-[min(90vw,70rem)] text-balance pb-[0.08em] text-center font-black leading-[1.05] tracking-tight"
          aria-label={title}
        >
          {wordEntries.map((entry, wordIdx) => (
            <div key={entry.key} className="overflow-visible">
              <span
                className={`block align-baseline whitespace-nowrap ${wordIdx === 0 ? primaryWordGradient : secondaryWordGradient} text-stroke-hero text-[clamp(3.5rem,14vw,5rem)] sm:text-[5.5rem] md:text-[6.5rem] lg:text-[7.5rem] xl:text-[8rem] 2xl:text-[9rem] ${
                  wordIdx === 0 ? "mb-1 sm:mb-2" : "pb-[0.22em] leading-[1.2]"
                }`}
              >
                {entry.letters.map((letter) => (
                  <span
                    key={letter.key}
                    className={`char inline-block will-change-transform ${
                      wordIdx === 0 ? primaryWordGradient : secondaryWordGradient
                    } text-stroke-hero -mx-[0.08em] px-[0.08em] pt-[0.15em] pb-[0.25em] -mt-[0.15em] -mb-[0.25em] leading-[1.2]`}
                  >
                    {letter.char}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </h1>
        <p
          ref={subtitleRef}
          className={`${geist.className} mx-auto mt-8 max-w-lg text-center text-xs sm:text-sm tracking-[0.18em] opacity-0 text-neutral-600 dark:text-neutral-300`}
        >
          {t("subtitle")}
        </p>
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


