"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "phosphor-react";
import { motion, AnimatePresence } from "motion/react";

import { geist } from "@/app/fonts";

type FooterLink = {
  label: string;
  href: string;
};

type FooterLinkDictionary = Record<string, FooterLink>;

const normalizeLinks = (dictionary: FooterLinkDictionary): FooterLink[] => {
  return Object.values(dictionary).map((link) => {
    const href = typeof link.href === "string" ? link.href.trim() : "";
    if (href.length === 0) {
      return { label: link.label, href: "#" };
    }
    return { label: link.label, href };
  });
};

const isExternalLink = (href: string): boolean => {
  return href.startsWith("http://") || href.startsWith("https://");
};

export function Footer() {
  const t = useTranslations("footer");

  const navigationLinks = useMemo(() => {
    return normalizeLinks(t.raw("navigation.links") as FooterLinkDictionary);
  }, [t]);

  const legalLinks = useMemo(() => {
    return normalizeLinks(t.raw("legal.links") as FooterLinkDictionary);
  }, [t]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const startYear = 2024;
  const copyright = t("meta.copyright", { start: startYear, end: currentYear });

  const [clicks, setClicks] = useState(0);
  const [secretActive, setSecretActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHeartClick = useCallback(() => {
    if (secretActive) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setSecretActive(true);
        return 0;
      }
      return next;
    });

    timeoutRef.current = setTimeout(() => {
      setClicks(0);
    }, 500);
  }, [secretActive]);

  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10">
          <nav aria-label={t("navigation.title")} className="flex flex-col gap-3">
            <h3 className={`${geist.className} text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400`}>
              {t("navigation.title")}
            </h3>
            <ul className="grid grid-cols-1 gap-2 text-sm font-medium text-neutral-200 sm:grid-cols-2">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="transition-colors hover:text-white"
                    target={isExternalLink(link.href) ? "_blank" : undefined}
                    rel={isExternalLink(link.href) ? "noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-sm font-medium text-neutral-200 md:justify-self-center md:text-center">{copyright}</p>

          <div className="flex flex-col items-start gap-3 text-sm text-neutral-300 md:items-end md:text-right">
            <div className="flex flex-wrap gap-4 text-sm font-medium text-neutral-300">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-white"
                  target={isExternalLink(link.href) ? "_blank" : undefined}
                  rel={isExternalLink(link.href) ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="text-neutral-400 h-6 flex w-full items-center justify-start md:justify-end">
              <AnimatePresence mode="wait">
                {secretActive ? (
                  <motion.span
                    key="secret"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="font-bold text-amber-400 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 text-left md:text-right"
                  >
                    {t("meta.secret")} 
                    <motion.span 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       transition={{ delay: 0.2 }}
                       className="ml-2 text-white inline-block"
                    >
                       🎉
                    </motion.span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="standard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-left md:text-right"
                  >
                    {t.rich("meta.madeWith", {
                      heart: () => (
                        <motion.span
                          className="inline-flex align-middle cursor-pointer text-red-500 hover:text-red-400 mx-1"
                          onClick={handleHeartClick}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart weight="fill" className="w-4 h-4" />
                        </motion.span>
                      ),
                    })}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



