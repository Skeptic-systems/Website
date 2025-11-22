"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
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
import { authClient } from "@/lib/auth/client";

export function Topbar() {
  const t = useTranslations("navbar");
  const session = authClient.useSession();
  const [isSigningOut, startSignOut] = useTransition();
  const [authMessage, setAuthMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const navItems: { name: string; link: string }[] = [
    { name: t("links.about"), link: "#about" },
    { name: t("links.tools"), link: "#tools" },
    { name: t("links.selfhosted"), link: "#selfhosted" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = Boolean(session.data?.user);
  const displayName = session.data?.user?.name || session.data?.user?.email;

  useEffect(() => {
    if (isAuthenticated) {
      setAuthMessage(null);
    }
  }, [isAuthenticated]);

  const handleSignOut = () => {
    setAuthMessage(null);
    startSignOut(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        setAuthMessage({ tone: "error", text: t("session.signOutError") });
        return;
      }

      setAuthMessage({ tone: "success", text: t("session.signOutSuccess") });
    });
  };

  return (
    <Navbar className="top-0">
      <NavBody>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <NavItems items={navItems} className="justify-self-center" />
          <div className="flex shrink-0 items-center justify-self-end gap-2">
            {isAuthenticated ? (
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
                {t("session.greeting", { name: displayName ?? t("session.anonymous") })}
              </span>
            ) : null}
            <ThemeToggle />
            <AccentToggle />
            <LocaleToggle />
            {!isAuthenticated ? (
              <NavbarButton href="/login" variant="primary">
                {t("cta.login")}
              </NavbarButton>
            ) : (
              <NavbarButton
                as="button"
                onClick={handleSignOut}
                variant="primary"
                className="disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSigningOut}
              >
                {isSigningOut ? t("session.signingOut") : t("cta.logout")}
              </NavbarButton>
            )}
            {authMessage ? (
              <span
                className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                  authMessage.tone === "error"
                    ? "text-red-500 dark:text-red-400"
                    : "text-emerald-500 dark:text-emerald-400"
                }`}
              >
                {authMessage.text}
              </span>
            ) : null}
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
            {!isAuthenticated ? (
              <NavbarButton
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="ml-auto"
              >
                {t("cta.login")}
              </NavbarButton>
            ) : (
              <NavbarButton
                as="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                variant="primary"
                className="ml-auto disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSigningOut}
              >
                {isSigningOut ? t("session.signingOut") : t("cta.logout")}
              </NavbarButton>
            )}
          </div>
          {authMessage ? (
            <span
              className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                authMessage.tone === "error"
                  ? "text-red-500 dark:text-red-400"
                  : "text-emerald-500 dark:text-emerald-400"
              }`}
            >
              {authMessage.text}
            </span>
          ) : null}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
