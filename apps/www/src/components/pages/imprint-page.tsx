"use client";

import Link from "next/link";
import { useMessages } from "next-intl";
import { CaretLeft } from "phosphor-react";

import { geist } from "@/app/fonts";

type ImprintMeta = {
  title: string;
  tagline: string;
  updated: string;
};

type ImprintOperator = {
  heading: string;
  name: string;
  address: string[];
  emailLabel: string;
  email: string;
  phoneLabel: string;
  phone: string;
};

type ImprintLink = {
  label: string;
  href: string;
  external?: boolean;
};

type ImprintSection = {
  title: string;
  paragraphs: string[];
  link?: string;
};

type ImprintMessages = {
  meta: ImprintMeta;
  operator: ImprintOperator;
  links?: Record<string, ImprintLink>;
  sections?: ImprintSection[];
  actions?: {
    back: string;
  };
};

const backgroundGridClass =
  "[background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]";

const cardClass =
  "rounded-[32px] border border-neutral-200/60 bg-white/75 p-8 text-neutral-700 shadow-xl backdrop-blur-lg transition dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:text-neutral-200 sm:p-10";

export function ImprintPageContent() {
  const messages = useMessages() as { imprint?: ImprintMessages } | null;
  const imprint = messages?.imprint;

  if (!imprint) {
    return null;
  }

  const { meta, operator, links = {}, sections = [], actions } = imprint;
  const backLabel = actions?.back ?? "Back";

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <div className={`absolute inset-0 ${backgroundGridClass}`} />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <section className="relative z-10 px-6 py-24 sm:py-28">
        <div className="mx-auto w-full max-w-4xl space-y-14">
          <div className="flex justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800/70 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-100"
            >
              <CaretLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          </div>

          <header className="space-y-5 text-center">
            <p className={`${geist.className} text-xs uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400`}>
              {meta.updated}
            </p>
            <h1 className={`${geist.className} text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl`}>
              {meta.title}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-neutral-600 dark:text-neutral-300">{meta.tagline}</p>
          </header>

          <article className={cardClass}>
            <div className="space-y-5">
              <h2 className={`${geist.className} text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50`}>
                {operator.heading}
              </h2>
              <div className="space-y-2 text-sm leading-relaxed">
                <p className="font-medium text-neutral-800 dark:text-neutral-100">{operator.name}</p>
                <address className="not-italic text-neutral-600 dark:text-neutral-300">
                  {operator.address.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
              </div>
              <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  {operator.emailLabel}:{" "}
                  <a href={`mailto:${operator.email}`} className="underline-offset-4 transition hover:underline">
                    {operator.email}
                  </a>
                </p>
                <p>
                  {operator.phoneLabel}:{" "}
                  <a href={`tel:${normalizePhone(operator.phone)}`} className="underline-offset-4 transition hover:underline">
                    {operator.phone}
                  </a>
                </p>
              </div>
            </div>
          </article>

          <div className="space-y-10">
            {sections.map((section) => {
              const sectionLink = section.link ? links[section.link] : null;
              return (
                <article key={section.title} className={cardClass}>
                  <div className="space-y-5">
                    <h2 className={`${geist.className} text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50`}>
                      {section.title}
                    </h2>
                    <div className="space-y-4 text-sm leading-relaxed">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    {sectionLink ? (
                      <p className="text-sm text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100">
                        {renderLink(sectionLink)}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function renderLink(link: ImprintLink) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className="underline-offset-4 hover:underline">
      {link.label}
    </Link>
  );
}

function normalizePhone(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

