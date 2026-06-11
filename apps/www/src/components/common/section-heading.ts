"use client";

import { geist } from "@/app/fonts";
import { cn } from "@/lib/utils";

const BASE_HEADING_CLASSES =
  "text-[2.8rem] sm:text-[3.6rem] md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight bg-gradient-to-b from-neutral-900 via-neutral-700 to-neutral-500 bg-clip-text text-transparent dark:from-neutral-50 dark:via-neutral-300 dark:to-neutral-600";

export const sectionHeadingClass = (extra?: string): string => {
  return cn(geist.className, BASE_HEADING_CLASSES, extra);
};





