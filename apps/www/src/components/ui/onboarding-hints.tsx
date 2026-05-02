"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { indieFlower } from "@/app/fonts";

const arrowFilterDark = "brightness(0) invert(0.78) sepia(0.4) hue-rotate(220deg) saturate(2) brightness(0.9)";
const arrowFilterLight = "brightness(0) invert(0.35) sepia(0.6) hue-rotate(230deg) saturate(3) brightness(0.7)";

export function OnboardingHints() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const arrowFilter = isDark ? arrowFilterDark : arrowFilterLight;
  const textColor = isDark ? "text-[#c4b0e0]" : "text-[#6b4fa0]";

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY < 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const offset = locale === "de" ? "right-[12.25rem]" : "right-[11rem]";
  const offsetLocale = locale === "de" ? "-right-[20px]" : "-right-[40px]";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 hidden lg:block transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative mx-auto w-full max-w-7xl px-8">
        <div className={`absolute ${offset} top-12 flex items-start gap-2`}>
          <span
            className={`${indieFlower.className} mt-8 max-w-[130px] text-right text-[15px] leading-tight ${textColor}`}
          >
            {t("accentHint")}
          </span>
          <Image
            src="/asstes/arrows/arrow-right.svg"
            alt=""
            width={45}
            height={50}
            className="h-auto"
            style={{ filter: arrowFilter }}
          />
        </div>

        <div className={`absolute ${offsetLocale} top-12 flex items-start gap-2`}>
          <Image
            src="/asstes/arrows/arrow-left.svg"
            alt=""
            width={40}
            height={45}
            className="h-auto"
            style={{ filter: arrowFilter }}
          />
          <span
            className={`${indieFlower.className} mt-8 max-w-[130px] text-left text-[15px] leading-tight ${textColor}`}
          >
            {t("localeHint")}
          </span>
        </div>
      </div>
    </div>
  );
}
