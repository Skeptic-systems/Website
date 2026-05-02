"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Code, PlugsConnected, Medal } from "phosphor-react";

import { geist } from "@/app/fonts";
import { GlowTile } from "@/components/ui/glow-tile";
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";

export function AboutMe() {
  const t = useTranslations("about");
  const aboutAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(({ node, gsap }) => {
    const ease = "power2.out";

    const heading = node.querySelector<HTMLElement>("[data-animate='section-heading']");
    if (heading) {
      gsap.fromTo(heading, { y: 20, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.45, ease,
        scrollTrigger: { trigger: heading, start: "top 88%", once: true },
        clearProps: "all",
      });
    }

    const tiles = node.querySelectorAll<HTMLElement>("[data-animate='about-tile']");
    if (tiles.length > 0) {
      const trigger = node.querySelector("[data-animate='about-tiles']") ?? heading ?? node;
      gsap.fromTo(tiles, { y: 24, opacity: 0, scale: 0.96 }, {
        y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.2)",
        stagger: 0.06,
        scrollTrigger: { trigger, start: "top 80%", once: true },
        clearProps: "transform,opacity",
      });
    }
  }, []);
  const sectionRef = useGsapSection<HTMLDivElement>(aboutAnimation);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen"
    >
      {/* full-section background grid and mask to match hero height */}
      <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* top area keeps original height so tiles stay at same vertical position */}
      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2
            data-animate="section-heading"
            className={sectionHeadingClass("text-center mt-16 sm:mt-20 md:mt-24")}
          >
            {t("title")}
          </h2>
        </div>
      </div>
      <div className="relative z-10 px-6 -mt-10 sm:-mt-16 md:-mt-24 pb-16">
        <div className="mx-auto w-full max-w-7xl">
          <div
            data-animate="about-tiles"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <GlowTile
              data-animate="about-tile"
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
              data-animate="about-tile"
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
              data-animate="about-tile"
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


