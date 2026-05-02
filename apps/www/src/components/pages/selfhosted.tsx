"use client";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Clock, Cpu, FilmSlate, HardDrive, HardDrives, StackSimple, UsersThree } from "phosphor-react";

import { geist } from "@/app/fonts";
import { sectionHeadingClass } from "@/components/common/section-heading";
import {
  type GsapSectionSetup,
  useGsapSection,
} from "@/lib/gsap-animations";
import { requestJson } from "@/lib/request";
import { useSectionIntersection } from "@/lib/use-section-intersection";

type PterodactylServerLimits = {
  memory: number;
  disk: number;
  cpu: number;
};

type PterodactylActiveServer = {
  id: number;
  identifier: string;
  uuid: string;
  name: string;
  description: string | null;
  isSuspended: boolean;
  limits: PterodactylServerLimits;
  state: string;
  uptime: number | null;
};

type PterodactylServerResources = {
  identifier: string;
  state: string;
  isSuspended: boolean;
  memoryBytes: number;
  cpuPercent: number;
  diskBytes: number;
  network: {
    rxBytes: number | null;
    txBytes: number | null;
  };
  uptime: number | null;
};

type PterodactylActiveServersResponse = {
  servers: PterodactylActiveServer[];
};

type PterodactylTotalServersResponse = {
  total: number;
};

type PterodactylServerResourcesResponse = {
  resources: PterodactylServerResources;
};

type JellyfinLibraryCounts = {
  totalItems: number;
  movies: number;
  series: number;
  seasons: number;
  episodes: number;
  albums: number;
  songs: number;
  artists: number;
  audiobooks: number;
  boxSets: number;
  games: number;
  programs: number;
};

type JellyfinServerInfo = {
  id: string | null;
  name: string | null;
  version: string | null;
  operatingSystem: string | null;
  productName: string | null;
};

type JellyfinNowPlaying = {
  title: string | null;
  mediaType: string | null;
  type: string | null;
  seriesName: string | null;
  seasonName: string | null;
  productionYear: number | null;
  runTimeTicks: number | null;
  positionTicks: number | null;
  isPaused: boolean | null;
};

type JellyfinActiveSession = {
  id: string;
  userId: string | null;
  userName: string | null;
  client: string | null;
  deviceName: string | null;
  deviceId: string | null;
  isTranscoding: boolean;
  nowPlaying: JellyfinNowPlaying | null;
};

type JellyfinOverview = {
  server: JellyfinServerInfo;
  counts: {
    users: number;
    libraries: JellyfinLibraryCounts;
  };
  sessions: {
    activeCount: number;
    transcodingCount: number;
  };
  generatedAt: string;
};

type JellyfinOverviewResponse = {
  overview: JellyfinOverview;
};

type JellyfinActiveSessionsResponse = {
  sessions: JellyfinActiveSession[];
  count: number;
};

type SectionHeadingProps = {
  accent: string;
  title: string;
  description: string;
  accentClassName: string;
};

type StatCardProps = {
  label: string;
  value: string;
  tone: "plum" | "sky";
};

const PTERODACTYL_SKELETON_KEYS = ["ptero-alpha", "ptero-beta", "ptero-gamma", "ptero-delta"];
const JELLYFIN_SKELETON_KEYS = ["jellyfin-primary", "jellyfin-secondary"];
const BYTES_PER_MEB = 1024 * 1024;
const TICKS_PER_SECOND = 10_000_000;

function SectionHeading({
  accent,
  title,
  description,
  accentClassName,
}: SectionHeadingProps): ReactElement {
  return (
    <div className="space-y-4">
      <p
        className={`${geist.className} text-xs uppercase tracking-[0.32em] ${accentClassName}`}
      >
        {accent}
      </p>
      <h3
        className={`${geist.className} text-[clamp(1.9rem,6vw,2.8rem)] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl`}
      >
        {title}
      </h3>
      <p className="max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function StatCard({ label, value, tone }: StatCardProps): ReactElement {
  const accentBorder =
    tone === "plum"
      ? "border-fuchsia-300/40 dark:border-fuchsia-500/20"
      : "border-sky-300/40 dark:border-sky-500/20";
  const accentGlow =
    tone === "plum"
      ? "from-fuchsia-500/8 to-transparent dark:from-fuchsia-500/6"
      : "from-sky-500/8 to-transparent dark:from-sky-500/6";
  return (
    <div
      data-animate="selfhosted-stat"
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white/60 px-5 py-5 backdrop-blur-md transition-shadow hover:shadow-lg dark:bg-neutral-900/50 sm:px-6 sm:py-6 ${accentBorder}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${accentGlow}`} />
      <p className="relative text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p className={`${geist.className} relative mt-2 text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50 sm:text-4xl`}>
        {value}
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let current = bytes;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  const precision = current < 10 && index > 0 ? 1 : 0;
  return `${current.toFixed(precision)} ${units[index]}`;
}

function formatPercent(value: number | null, fallback: string): string {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  const precision = value < 10 ? 1 : 0;
  return `${value.toFixed(precision)}%`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat().format(value);
}

function formatDurationFromSeconds(value: number | null, fallback: string): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  const totalSeconds = Math.floor(value);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

function convertTicksToSeconds(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value / TICKS_PER_SECOND;
}

function calculateSessionProgress(session: JellyfinActiveSession): number | null {
  if (!session.nowPlaying) {
    return null;
  }

  const total = convertTicksToSeconds(session.nowPlaying.runTimeTicks);
  const position = convertTicksToSeconds(session.nowPlaying.positionTicks);

  if (total === null || total <= 0 || position === null || position < 0) {
    return null;
  }

  const ratio = (position / total) * 100;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return null;
  }

  return Math.min(ratio, 100);
}

function buildSessionSubtitle(session: JellyfinActiveSession): string | null {
  const nowPlaying = session.nowPlaying;

  if (!nowPlaying) {
    return null;
  }

  const segments: string[] = [];

  if (nowPlaying.seriesName) {
    segments.push(nowPlaying.seriesName);
  }

  if (nowPlaying.seasonName) {
    segments.push(nowPlaying.seasonName);
  }

  if (typeof nowPlaying.productionYear === "number" && Number.isFinite(nowPlaying.productionYear)) {
    segments.push(String(nowPlaying.productionYear));
  }

  if (segments.length === 0) {
    return null;
  }

  return segments.join(" • ");
}

function getSessionStateKey(session: JellyfinActiveSession): "nowPlaying" | "paused" | "idle" {
  if (!session.nowPlaying) {
    return "idle";
  }

  if (session.nowPlaying.isPaused) {
    return "paused";
  }

  return "nowPlaying";
}

export function Selfhosted() {
  const t = useTranslations("selfhosted");
  const tCommon = useTranslations("common");

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const shouldLoadSelfhosted = useSectionIntersection("selfhosted", { rootMargin: "35%" });

  if (!apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  const [isPterodactylLoading, setIsPterodactylLoading] = useState(true);
  const [pterodactylError, setPterodactylError] = useState(false);
  const [pterodactylServers, setPterodactylServers] = useState<PterodactylActiveServer[]>([]);
  const [pterodactylTotal, setPterodactylTotal] = useState<number | null>(null);
  const [pterodactylResources, setPterodactylResources] = useState<Record<
    string,
    PterodactylServerResources
  >>({});
  const [isPterodactylResourcesLoading, setIsPterodactylResourcesLoading] = useState(false);

  const [isJellyfinLoading, setIsJellyfinLoading] = useState(true);
  const [jellyfinError, setJellyfinError] = useState(false);
  const [jellyfinOverview, setJellyfinOverview] = useState<JellyfinOverview | null>(null);
  const [jellyfinSessions, setJellyfinSessions] = useState<JellyfinActiveSession[]>([]);

  useEffect(() => {
    if (!shouldLoadSelfhosted) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    setIsPterodactylLoading(true);
    setPterodactylError(false);

    Promise.all([
      requestJson<PterodactylActiveServersResponse>(`${apiBase}/pterodactyl/active-server`, {
        signal: controller.signal,
      }),
      requestJson<PterodactylTotalServersResponse>(`${apiBase}/pterodactyl/total-number`, {
        signal: controller.signal,
      }),
    ])
      .then(([active, total]) => {
        if (!isMounted) {
          return;
        }

        if (!active) {
          setPterodactylError(true);
          setPterodactylServers([]);
        } else {
          setPterodactylServers(Array.isArray(active.servers) ? active.servers : []);
        }

        setPterodactylTotal(total?.total ?? null);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setPterodactylError(true);
          setPterodactylServers([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPterodactylLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase, shouldLoadSelfhosted]);

  useEffect(() => {
    if (!shouldLoadSelfhosted) {
      return;
    }

    if (pterodactylServers.length === 0) {
      setPterodactylResources({});
      setIsPterodactylResourcesLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    setIsPterodactylResourcesLoading(true);

    const run = async () => {
      const entries = await Promise.all(
        pterodactylServers.map(async (server) => {
          const response = await requestJson<PterodactylServerResourcesResponse>(
            `${apiBase}/pterodactyl/servers/${server.identifier}/resources`,
            { signal: controller.signal }
          );

          if (!response || !response.resources) {
            return null;
          }

          return [server.identifier, response.resources] as const;
        })
      );

      if (!isMounted) {
        return;
      }

      const mapped: Record<string, PterodactylServerResources> = {};

      for (const entry of entries) {
        if (!entry) {
          continue;
        }

        const [identifier, resources] = entry;
        mapped[identifier] = resources;
      }

      setPterodactylResources(mapped);
    };

    run()
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setPterodactylResources({});
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsPterodactylResourcesLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase, pterodactylServers, shouldLoadSelfhosted]);

  useEffect(() => {
    if (!shouldLoadSelfhosted) {
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    setIsJellyfinLoading(true);
    setJellyfinError(false);

    Promise.all([
      requestJson<JellyfinOverviewResponse>(`${apiBase}/jellyfin/overview`, {
        signal: controller.signal,
      }),
      requestJson<JellyfinActiveSessionsResponse>(`${apiBase}/jellyfin/active-sessions`, {
        signal: controller.signal,
      }),
    ])
      .then(([overview, sessions]) => {
        if (!isMounted) {
          return;
        }

        if (!overview || !overview.overview) {
          setJellyfinOverview(null);
          setJellyfinError(true);
        } else {
          setJellyfinOverview(overview.overview);
        }

        setJellyfinSessions(Array.isArray(sessions?.sessions) ? sessions.sessions : []);
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setJellyfinOverview(null);
          setJellyfinSessions([]);
          setJellyfinError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsJellyfinLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase, shouldLoadSelfhosted]);

  const pterodactylMemoryTotal = useMemo(() => {
    return pterodactylServers.reduce((total, server) => {
      const resources = pterodactylResources[server.identifier];
      if (!resources) {
        return total;
      }
      return total + resources.memoryBytes;
    }, 0);
  }, [pterodactylResources, pterodactylServers]);

  const pterodactylCpuAverage = useMemo(() => {
    const summary = pterodactylServers.reduce(
      (accumulator, server) => {
        const resources = pterodactylResources[server.identifier];
        if (!resources) {
          return accumulator;
        }

        return {
          sum: accumulator.sum + resources.cpuPercent,
          count: accumulator.count + 1,
        };
      },
      { sum: 0, count: 0 }
    );

    if (summary.count === 0) {
      return null;
    }

    return summary.sum / summary.count;
  }, [pterodactylResources, pterodactylServers]);

  const jellyfinLibraryCount = useMemo(() => {
    if (!jellyfinOverview) {
      return 0;
    }
    return jellyfinOverview.counts.libraries.totalItems;
  }, [jellyfinOverview]);

  const jellyfinUsersCount = useMemo(() => {
    if (!jellyfinOverview) {
      return 0;
    }
    return jellyfinOverview.counts.users;
  }, [jellyfinOverview]);

  const jellyfinActiveSessions = useMemo(() => {
    if (!jellyfinOverview) {
      return 0;
    }
    return jellyfinOverview.sessions.activeCount;
  }, [jellyfinOverview]);

  const jellyfinTranscodingSessions = useMemo(() => {
    if (!jellyfinOverview) {
      return 0;
    }
    return jellyfinOverview.sessions.transcodingCount;
  }, [jellyfinOverview]);

  const jellyfinGeneratedAtLabel = useMemo(() => {
    if (!jellyfinOverview) {
      return null;
    }
    const date = new Date(jellyfinOverview.generatedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString();
  }, [jellyfinOverview]);

  const pterodactylSignature = pterodactylServers.map((server) => server.identifier).join("|");
  const jellyfinSessionsSignature = jellyfinSessions.map((session) => session.id).join("|");
  const jellyfinOverviewKey = jellyfinOverview?.generatedAt ?? "none";

  const selfhostedAnimation = useCallback<GsapSectionSetup<HTMLDivElement>>(
    ({ node, gsap }) => {
      const ease = "power2.out";

      const heading = node.querySelector<HTMLElement>("[data-animate='section-heading']");
      if (heading) {
        gsap.fromTo(heading, { y: 20, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.45, ease,
          scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          clearProps: "all",
        });
      }

      const introCopies = node.querySelectorAll<HTMLElement>("[data-animate='section-copy']");
      introCopies.forEach((copy, index) => {
        gsap.fromTo(copy, { y: 14, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.35, ease, delay: index * 0.04,
          scrollTrigger: { trigger: copy, start: "top 88%", once: true },
          clearProps: "all",
        });
      });

      const panels = node.querySelectorAll<HTMLElement>("[data-animate='selfhosted-panel']");
      panels.forEach((panel) => {
        gsap.fromTo(panel, { y: 40, opacity: 0, scale: 0.98 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.5, ease,
          scrollTrigger: { trigger: panel, start: "top 82%", once: true },
          clearProps: "transform,opacity",
        });

        const stats = panel.querySelectorAll<HTMLElement>("[data-animate='selfhosted-stat']");
        if (stats.length > 0) {
          gsap.fromTo(stats, { y: 16, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.35, ease, stagger: 0.04,
            scrollTrigger: { trigger: panel, start: "top 80%", once: true },
            clearProps: "transform,opacity",
          });
        }

        const cards = panel.querySelectorAll<HTMLElement>("[data-animate='selfhosted-card']");
        if (cards.length > 0) {
          gsap.fromTo(cards, { y: 20, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.04,
            scrollTrigger: { trigger: panel, start: "top 78%", once: true },
            clearProps: "transform,opacity",
          });
        }
      });
    },
    [jellyfinOverviewKey, jellyfinSessionsSignature, pterodactylSignature],
  );

  const sectionRef = useGsapSection<HTMLDivElement>(selfhostedAnimation);

  return (
    <section
      ref={sectionRef}
      id="selfhosted"
      className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen"
    >
      <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:28px_28px] [background-image:radial-gradient(#b9b9b9_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <h2
            data-animate="section-heading"
            className={sectionHeadingClass("mt-16 sm:mt-20 md:mt-24 text-center")}
          >
            {t("title")}
          </h2>
          <div className="max-w-3xl space-y-2">
            <p data-animate="section-copy" className="text-base leading-relaxed text-[#8B8D92] sm:text-lg">
              {t("intro.title")}
            </p>
            <p data-animate="section-copy" className="text-base leading-relaxed text-[#8B8D92] sm:text-lg">
              {t("intro.bodyOne")}
            </p>
            <p data-animate="section-copy" className="text-base leading-relaxed text-[#8B8D92] sm:text-lg">
              {t("intro.bodyTwo")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto w-full max-w-7xl space-y-24">
          <div
            data-animate="selfhosted-panel"
            className="relative overflow-hidden rounded-3xl border border-fuchsia-200/40 bg-white/70 p-6 shadow-2xl backdrop-blur-2xl dark:border-fuchsia-500/15 dark:bg-neutral-950/60 sm:p-10"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[120px] dark:bg-fuchsia-500/8" />
            <div className="pointer-events-none absolute -left-16 bottom-[-10%] h-56 w-56 rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-500/6" />
            <div className="relative space-y-10">
              <SectionHeading
                accent={t("sections.pterodactyl.accent")}
                title={t("sections.pterodactyl.title")}
                description={t("sections.pterodactyl.description")}
                accentClassName="text-fuchsia-500"
              />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  tone="plum"
                  label={t("sections.pterodactyl.metrics.total")}
                  value={
                    isPterodactylLoading && pterodactylTotal === null
                      ? tCommon("loading")
                      : pterodactylTotal !== null
                        ? String(pterodactylTotal)
                        : t("common.placeholder")
                  }
                />
                <StatCard
                  tone="plum"
                  label={t("sections.pterodactyl.metrics.active")}
                  value={
                    isPterodactylLoading ? tCommon("loading") : String(pterodactylServers.length)
                  }
                />
                <StatCard
                  tone="plum"
                  label={t("sections.pterodactyl.metrics.resources")}
                  value={
                    isPterodactylResourcesLoading
                      ? tCommon("loading")
                      : formatBytes(pterodactylMemoryTotal)
                  }
                />
                <StatCard
                  tone="plum"
                  label={t("sections.pterodactyl.metrics.cpu")}
                  value={
                    isPterodactylResourcesLoading
                      ? tCommon("loading")
                      : pterodactylCpuAverage !== null
                        ? formatPercent(pterodactylCpuAverage, t("common.placeholder"))
                        : t("common.placeholder")
                  }
                />
              </div>

              <div className="space-y-6">
                {isPterodactylLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {PTERODACTYL_SKELETON_KEYS.map((key) => (
                      <div
                        key={key}
                        className="relative h-36 overflow-hidden rounded-3xl border border-fuchsia-200/50 bg-white/60 dark:border-fuchsia-500/20 dark:bg-neutral-900/70"
                      >
                        <div className="space-y-3 p-5">
                          <div className="h-4 w-1/3 rounded-full bg-fuchsia-200/40 dark:bg-fuchsia-500/15" />
                          <div className="h-3 w-2/3 rounded-full bg-neutral-200/60 dark:bg-neutral-700/40" />
                          <div className="mt-4 flex gap-3">
                            <div className="h-3 w-16 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                            <div className="h-3 w-20 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                          </div>
                        </div>
                        <div className="animate-shimmer absolute inset-0" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {!isPterodactylLoading && pterodactylError ? (
                  <p className="rounded-3xl border border-fuchsia-200/50 bg-white/70 p-6 text-sm text-neutral-600 shadow-sm dark:border-fuchsia-500/20 dark:bg-neutral-900/70 dark:text-neutral-300">
                    {t("sections.pterodactyl.states.error")}
                  </p>
                ) : null}

                {!isPterodactylLoading && !pterodactylError && pterodactylServers.length === 0 ? (
                  <p className="rounded-3xl border border-fuchsia-200/50 bg-white/70 p-6 text-sm text-neutral-600 shadow-sm dark:border-fuchsia-500/20 dark:bg-neutral-900/70 dark:text-neutral-300">
                    {t("sections.pterodactyl.states.empty")}
                  </p>
                ) : null}

                {!isPterodactylLoading && !pterodactylError && pterodactylServers.length > 0 ? (
                  <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
                    {pterodactylServers.map((server) => {
                      const resources = pterodactylResources[server.identifier] ?? null;
                      const uptimeSeconds = resources?.uptime ?? server.uptime ?? null;
                      const uptimeLabel = formatDurationFromSeconds(
                        uptimeSeconds,
                        t("common.placeholder")
                      );

                      const cpuLabel = resources
                        ? formatPercent(resources.cpuPercent, t("common.placeholder"))
                        : t("common.placeholder");

                      const memoryLimitBytes =
                        server.limits.memory > 0 ? server.limits.memory * BYTES_PER_MEB : null;
                      const diskLimitBytes =
                        server.limits.disk > 0 ? server.limits.disk * BYTES_PER_MEB : null;

                      const memoryLabel = resources
                        ? memoryLimitBytes
                          ? `${formatBytes(resources.memoryBytes)} / ${formatBytes(memoryLimitBytes)}`
                          : t("sections.pterodactyl.cards.limits.unlimited")
                        : t("common.placeholder");

                      const diskLabel = resources
                        ? diskLimitBytes
                          ? `${formatBytes(resources.diskBytes)} / ${formatBytes(diskLimitBytes)}`
                          : t("sections.pterodactyl.cards.limits.unlimited")
                        : t("common.placeholder");

                      const cpuLimitLabel =
                        server.limits.cpu > 0
                          ? `${cpuLabel} / ${server.limits.cpu}%`
                          : cpuLabel;

                    return (
                      <div
                        data-animate="selfhosted-card"
                        key={server.identifier}
                        className="group/srv relative flex w-full min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-fuchsia-200/30 bg-white/50 p-5 backdrop-blur-xl transition duration-300 hover:border-fuchsia-300/50 hover:shadow-lg dark:border-fuchsia-500/10 dark:bg-neutral-900/40 dark:hover:border-fuchsia-500/25 md:flex-row md:items-start md:p-6"
                      >
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover/srv:opacity-100 dark:from-fuchsia-500/4" />
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600 ring-1 ring-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-500/15">
                            <HardDrives size={24} weight="fill" />
                          </div>
                          <div className="relative flex min-w-0 flex-1 flex-col gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 space-y-1">
                                <h4
                                  className={`${geist.className} truncate text-lg font-bold text-neutral-900 dark:text-neutral-50`}
                                >
                                  {server.name}
                                </h4>
                                {server.description ? (
                                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                    {server.description}
                                  </p>
                                ) : null}
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-fuchsia-500/10 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-400" />
                                {server.state}
                              </span>
                            </div>
                            <div className="grid gap-2.5 text-[0.8rem] text-neutral-600 dark:text-neutral-400 md:grid-cols-2 xl:grid-cols-3">
                              <div className="flex items-center gap-2">
                                <Cpu size={15} weight="bold" className="shrink-0 text-fuchsia-500/70" />
                                <span>{t("sections.pterodactyl.cards.limits.cpu")}: {cpuLimitLabel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StackSimple size={15} weight="bold" className="shrink-0 text-fuchsia-500/70" />
                                <span>{t("sections.pterodactyl.cards.limits.memory")}: {memoryLabel}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={15} weight="bold" className="shrink-0 text-fuchsia-500/70" />
                                <span>{t("sections.pterodactyl.cards.uptime")}: {uptimeLabel}</span>
                              </div>
                              <div className="flex items-center gap-2 md:col-span-2 xl:col-span-3">
                                <HardDrive size={15} weight="bold" className="shrink-0 text-fuchsia-500/70" />
                                <span>{t("sections.pterodactyl.cards.limits.disk")}: {diskLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div
            data-animate="selfhosted-panel"
            className="relative overflow-hidden rounded-3xl border border-sky-200/40 bg-white/70 p-6 shadow-2xl backdrop-blur-2xl dark:border-sky-500/15 dark:bg-neutral-950/60 sm:p-10"
          >
            <div className="pointer-events-none absolute -left-24 -top-16 h-80 w-80 rounded-full bg-sky-400/15 blur-[120px] dark:bg-sky-500/8" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/6" />
            <div className="relative space-y-10">
              <SectionHeading
                accent={t("sections.jellyfin.accent")}
                title={t("sections.jellyfin.title")}
                description={t("sections.jellyfin.description")}
                accentClassName="text-sky-500"
              />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  tone="sky"
                  label={t("sections.jellyfin.metrics.active")}
                  value={
                    isJellyfinLoading
                      ? tCommon("loading")
                      : String(jellyfinActiveSessions)
                  }
                />
                <StatCard
                  tone="sky"
                  label={t("sections.jellyfin.metrics.transcoding")}
                  value={
                    isJellyfinLoading
                      ? tCommon("loading")
                      : String(jellyfinTranscodingSessions)
                  }
                />
                <StatCard
                  tone="sky"
                  label={t("sections.jellyfin.metrics.users")}
                  value={
                    isJellyfinLoading
                      ? tCommon("loading")
                      : String(jellyfinUsersCount)
                  }
                />
                <StatCard
                  tone="sky"
                  label={t("sections.jellyfin.metrics.media")}
                  value={
                    isJellyfinLoading
                      ? tCommon("loading")
                      : jellyfinLibraryCount > 0
                        ? formatNumber(jellyfinLibraryCount)
                        : t("common.placeholder")
                  }
                />
              </div>

              {isJellyfinLoading ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  {JELLYFIN_SKELETON_KEYS.map((key) => (
                    <div
                      key={key}
                      className="relative h-36 overflow-hidden rounded-3xl border border-sky-200/50 bg-white/60 dark:border-sky-500/20 dark:bg-neutral-900/70"
                    >
                      <div className="space-y-3 p-5">
                        <div className="h-4 w-1/4 rounded-full bg-sky-200/40 dark:bg-sky-500/15" />
                        <div className="h-3 w-1/2 rounded-full bg-neutral-200/60 dark:bg-neutral-700/40" />
                        <div className="mt-4 flex gap-3">
                          <div className="h-3 w-14 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                          <div className="h-3 w-18 rounded-full bg-neutral-200/50 dark:bg-neutral-700/30" />
                        </div>
                      </div>
                      <div className="animate-shimmer absolute inset-0" />
                    </div>
                  ))}
                </div>
              ) : null}

              {!isJellyfinLoading && jellyfinError ? (
                <p className="rounded-3xl border border-sky-200/50 bg-white/70 p-6 text-sm text-neutral-600 shadow-sm dark:border-sky-500/20 dark:bg-neutral-900/70 dark:text-neutral-300">
                  {t("sections.jellyfin.states.error")}
                </p>
              ) : null}

              {!isJellyfinLoading && !jellyfinError && jellyfinOverview ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="flex w-full min-w-0 flex-col gap-6 overflow-hidden rounded-2xl border border-sky-200/30 bg-white/50 p-5 backdrop-blur-xl dark:border-sky-500/10 dark:bg-neutral-900/40 sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/15">
                        <FilmSlate size={24} weight="fill" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                          {t("sections.jellyfin.server.heading")}
                        </p>
                        <h4
                          className={`${geist.className} mt-0.5 text-xl font-bold text-neutral-900 dark:text-neutral-50`}
                        >
                          {jellyfinOverview.server.name ?? t("common.placeholder")}
                        </h4>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                        {t("sections.jellyfin.server.os")}
                      </p>
                      <p className="text-neutral-700 dark:text-neutral-300">{jellyfinOverview.server.operatingSystem ?? t("common.placeholder")}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                        {t("sections.jellyfin.sessions.title")}
                      </p>
                      <div className="mt-3 space-y-3">
                        {jellyfinSessions.length === 0 ? (
                          <p className="rounded-xl border border-sky-200/30 bg-white/40 p-4 text-sm text-neutral-500 dark:border-sky-500/10 dark:bg-neutral-900/30 dark:text-neutral-400">
                            {t("sections.jellyfin.states.empty")}
                          </p>
                        ) : (
                          jellyfinSessions.map((session) => {
                            const stateKey = getSessionStateKey(session);
                            const stateLabel = t(`sections.jellyfin.sessions.${stateKey}`);
                            const progress = calculateSessionProgress(session);
                            const subtitle = buildSessionSubtitle(session);

                            return (
                              <div
                                data-animate="selfhosted-card"
                                key={session.id}
                                className="group/session rounded-xl border border-sky-200/25 bg-white/40 p-4 transition duration-300 hover:border-sky-300/40 hover:shadow-md dark:border-sky-500/8 dark:bg-neutral-900/30 dark:hover:border-sky-500/20"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-[160px] space-y-0.5">
                                    <p
                                      className={`${geist.className} text-base font-bold text-neutral-900 dark:text-neutral-50`}
                                    >
                                      {session.userName ?? t("common.placeholder")}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      {session.client ?? session.deviceName ?? t("common.placeholder")}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                                    <span className={`h-1.5 w-1.5 rounded-full ${stateKey === "nowPlaying" ? "bg-sky-500 dark:bg-sky-400" : stateKey === "paused" ? "bg-amber-500 dark:bg-amber-400" : "bg-neutral-400 dark:bg-neutral-500"}`} />
                                    {stateLabel}
                                  </span>
                                </div>
                                <div className="mt-2.5 space-y-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                                  {session.nowPlaying ? (
                                    <p className="font-medium text-neutral-800 dark:text-neutral-200">
                                      {session.nowPlaying.title ?? t("common.placeholder")}
                                    </p>
                                  ) : null}
                                  {subtitle ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
                                </div>
                                {progress !== null ? (
                                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-200/50 dark:bg-neutral-800/60">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full min-w-0 flex-col gap-5 overflow-hidden rounded-2xl border border-sky-200/30 bg-white/50 p-5 backdrop-blur-xl dark:border-sky-500/10 dark:bg-neutral-900/40 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/15">
                        <UsersThree size={20} weight="fill" />
                      </div>
                      <div>
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                          {t("sections.jellyfin.metrics.users")}
                        </p>
                        <p className={`${geist.className} text-xl font-bold text-neutral-900 dark:text-neutral-50`}>
                          {jellyfinUsersCount}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-sky-200/25 bg-white/40 p-4 dark:border-sky-500/8 dark:bg-neutral-900/30">
                      <p className={`${geist.className} text-sm font-bold text-neutral-900 dark:text-neutral-100`}>
                        {t("sections.jellyfin.metrics.media")}
                      </p>
                      <ul className="mt-3 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <li className="flex items-center justify-between">
                          <span>{t("sections.jellyfin.library.movies")}</span>
                          <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{jellyfinOverview.counts.libraries.movies}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>{t("sections.jellyfin.library.series")}</span>
                          <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{jellyfinOverview.counts.libraries.series}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>{t("sections.jellyfin.library.episodes")}</span>
                          <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{jellyfinOverview.counts.libraries.episodes}</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>{t("sections.jellyfin.library.songs")}</span>
                          <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{jellyfinOverview.counts.libraries.songs}</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-[0.65rem] text-neutral-400 dark:text-neutral-500">
                      {t("sections.jellyfin.generatedAt", {
                        timestamp: jellyfinGeneratedAtLabel ?? t("common.placeholder"),
                      })}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
