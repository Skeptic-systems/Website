"use client";

import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("hero");
  const title = t("title");
  const [firstWord, ...restWords] = title.split(" ");
  const secondWord = restWords.join(" ");

  return (
    <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 w-full px-6 sm:px-8 -mt-20 sm:-mt-28 md:-mt-40">
        <h1
          className={`mx-auto text-center font-black leading-[1.05] tracking-tight text-balance pb-[0.08em]`}
          aria-label={title}
        >
          <span className="block align-baseline text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[8rem] 2xl:text-[10rem] mb-1 sm:mb-2">
            {firstWord}
          </span>
          <span className="block align-baseline text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[8rem] 2xl:text-[10rem] leading-[1.2] pb-[0.22em] text-stroke-hero">
            {secondWord}
          </span>
        </h1>
      </div>
    </section>
  );
}
