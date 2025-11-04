"use client";

import { useTranslations } from "next-intl";
import { geist } from "@/app/fonts";

export function Selfhosted() {
  const t = useTranslations("selfhosted");
  return (
    <section id="selfhosted" className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
      <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2 className={`${geist.className} text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mt-16 sm:mt-20 md:mt-24`}>
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-10 sm:-mt-16 md:-mt-24 pb-16">
        <div className="mx-auto w-full max-w-7xl min-h-[40vh]" />
      </div>
    </section>
  );
}


