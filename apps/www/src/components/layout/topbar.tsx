"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccentToggle } from "@/components/navigation/navbar/accent-toggle";
import { LocaleToggle } from "@/components/navigation/navbar/locale-toggle";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
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
import { authClient } from "@/lib/auth/client";

export function Topbar() {
  const t = useTranslations("navbar");
  const session = authClient.useSession();

  const navItems: { name: string; link: string }[] = [
    { name: t("links.about"), link: "#about" },
    { name: t("links.tools"), link: "#tools" },
    { name: t("links.selfhosted"), link: "#selfhosted" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = Boolean(session.data?.user);

  const primaryCta = isAuthenticated
    ? { href: "/dashboard", label: t("cta.dashboard") }
    : { href: "/login", label: t("cta.login") };

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
            <NavbarButton href={primaryCta.href} variant="primary">
              {primaryCta.label}
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
              href={primaryCta.href}
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              className="ml-auto"
            >
              {primaryCta.label}
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
