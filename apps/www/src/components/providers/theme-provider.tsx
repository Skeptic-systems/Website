"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps as NextThemesProviderProps,
} from "next-themes";
import { AccentProvider } from "@/components/providers/accent-provider";

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AccentProvider>{children}</AccentProvider>
    </NextThemesProvider>
  );
}
