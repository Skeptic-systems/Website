"use client";

import { useTranslations } from "next-intl";
import { geist } from "@/app/fonts";

export function AboutMe() {
  const t = useTranslations("about");
  return (
    <section id="about" className="relative w-full">
      <div className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
        <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
        <div className="accent-glow-layer-right" />
        <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2 className={`${geist.className} text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mt-16 sm:mt-24 md:mt-32`}>
            {t("title")}
          </h2>
        </div>
      </div>
    </section>
  );
}


