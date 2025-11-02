"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccentToggle } from "@/components/navbar/accent-toggle";
import { LocaleToggle } from "@/components/navbar/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar,
  NavbarButton,
  NavItems,
} from "@/components/ui/resizable-navbar";

export function Topbar() {
  const t = useTranslations("navbar");

  const navItems: { name: string; link: string }[] = [
    { name: t("links.about"), link: "#about" },
    { name: t("links.features"), link: "#features" },
    { name: t("links.contact"), link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Navbar className="top-0">
      <NavBody>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <NavItems items={navItems} className="justify-self-center" />
          <div className="flex shrink-0 items-center justify-self-end gap-2">
            <ThemeToggle />
            <AccentToggle />
            <LocaleToggle />
            <NavbarButton href="/login" variant="primary">
              {t("cta.login")}
            </NavbarButton>
          </div>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
          {navItems.map((item) => (
            <a
              key={item.link}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full items-center justify-end gap-2">
            <ThemeToggle />
            <AccentToggle />
            <LocaleToggle />
            <NavbarButton
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              className="ml-auto"
            >
              {t("cta.login")}
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
