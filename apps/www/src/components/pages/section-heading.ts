"use client";

import { geist } from "@/app/fonts";
import { cn } from "@/lib/utils";

const BASE_HEADING_CLASSES =
  "text-[2.8rem] sm:text-[3.6rem] md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight";

export const sectionHeadingClass = (extra?: string): string => {
  return cn(geist.className, BASE_HEADING_CLASSES, extra);
};


