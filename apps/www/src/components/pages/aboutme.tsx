"use client";

import { useTranslations } from "next-intl";
import { geist } from "@/app/fonts";
import { GlowTile } from "@/components/ui/glow-tile";
import { Code, PlugsConnected, Medal } from "phosphor-react";

export function AboutMe() {
  const t = useTranslations("about");
  return (
    <section id="about" className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
      {/* full-section background grid and mask to match hero height */}
      <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* top area keeps original height so tiles stay at same vertical position */}
      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2 className={`${geist.className} text-[2.9rem] sm:text-[3.8rem] md:text-7xl lg:text-8xl font-bold tracking-tight mt-16 sm:mt-20 md:mt-24`}>
            {t("title")}
          </h2>
        </div>
      </div>
      <div className="relative z-10 px-6 -mt-10 sm:-mt-16 md:-mt-24 pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlowTile
              label={t("tiles.developer.title")}
              glowFrom="#ff7aa2"
              glowTo="#ff3d8a"
              ringColor="#ff4d97"
              icon={<Code size={28} weight="fill" />}
            >
              <div>
                <h3 className={`${geist.className} text-2xl sm:text-3xl font-bold mb-3 text-center`}>
                  {t("tiles.developer.title")}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-left text-[#8B8D92]">
                  {t("tiles.developer.body")}
                </p>
              </div>
            </GlowTile>
            <GlowTile
              label={t("tiles.two")}
              glowFrom="#f7e06e"
              glowTo="#f5b942"
              ringColor="#f2c14e"
              icon={<PlugsConnected size={28} weight="fill" />}
            >
              <div>
                <h3 className={`${geist.className} text-2xl sm:text-3xl font-bold mb-3 text-center`}>
                  {t("tiles.integrator.title")}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-left text-[#8B8D92]">
                  {t("tiles.integrator.body")}
                </p>
              </div>
            </GlowTile>
            <GlowTile
              label={t("tiles.three")}
              glowFrom="#7ee9ff"
              glowTo="#3fc8e0"
              ringColor="#57d1e3"
              icon={<Medal size={28} weight="fill" />}
            >
              <div>
                <h3 className={`${geist.className} text-2xl sm:text-3xl font-bold mb-3 text-center`}>
                  {t("tiles.general.title")}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-left text-[#8B8D92]">
                  {t("tiles.general.body")}
                </p>
              </div>
            </GlowTile>
          </div>
        </div>
      </div>
    </section>
  );
}


