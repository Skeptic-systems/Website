"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { geist } from "@/app/fonts";

type SpotifyArtist = {
  id: string;
  name: string;
};

type SpotifyAlbum = {
  id: string;
  name: string;
  imageUrl: string;
};

type SpotifyTrack = {
  id: string;
  name: string;
  durationMs: number;
  previewUrl: string | null;
  externalUrl: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  rank?: number | null;
};

type TopTracksResponse = {
  tracks: SpotifyTrack[];
};

type Playback = {
  isPlaying: boolean;
  progressMs: number | null;
  currentlyPlayingType: string;
  track: SpotifyTrack | null;
};

type CurrentlyPlayingResponse = {
  playback: Playback | null;
};

type DiscordActivityAsset = {
  key: string | null;
  text: string | null;
  url: string | null;
};

type DiscordActivityAssets = {
  large?: DiscordActivityAsset | null;
  small?: DiscordActivityAsset | null;
};

type DiscordActivityTimestamps = {
  start?: number | null;
  end?: number | null;
};

type DiscordActivity = {
  id: string;
  name: string;
  type: number;
  state?: string | null;
  details?: string | null;
  url?: string | null;
  timestamps?: DiscordActivityTimestamps | null;
  assets?: DiscordActivityAssets | null;
};

type DiscordPresence = {
  status: string;
  activities: DiscordActivity[];
};

type DiscordPresenceResponse = {
  presence: DiscordPresence | null;
};

function formatMsToTime(ms: number): string {
  if (ms <= 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const secondsLabel = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${secondsLabel}`;
}

function SectionHeader({ accent, title }: { accent: string; title: string }): JSX.Element {
  return (
    <div className="space-y-2">
      <p className={`${geist.className} text-xs uppercase tracking-[0.32em] text-emerald-400/90`}>{accent}</p>
      <h3 className={`${geist.className} text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50`}>
        {title}
      </h3>
    </div>
  );
}

async function requestJson<T>(input: string, signal: AbortSignal | undefined): Promise<T | null> {
  try {
    const response = await fetch(input, {
      signal,
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (signal && error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    console.error(error);
    return null;
  }
}

export function Activity() {
  const t = useTranslations("activity");
  const tCommon = useTranslations("common");
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [isTopTracksLoading, setIsTopTracksLoading] = useState(true);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [isNowPlayingLoading, setIsNowPlayingLoading] = useState(true);
  const [activities, setActivities] = useState<DiscordActivity[]>([]);
  const [isPresenceLoading, setIsPresenceLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsTopTracksLoading(true);
    requestJson<TopTracksResponse>(`${apiBase}/spotify/top-tracks`, controller.signal)
      .then((data) => {
        if (!isMounted) {
          return;
        }
        if (!data || !Array.isArray(data.tracks)) {
          setTopTracks([]);
          return;
        }
        setTopTracks(data.tracks.slice(0, 5));
      })
      .finally(() => {
        if (isMounted) {
          setIsTopTracksLoading(false);
        }
      });
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBase]);

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    setIsNowPlayingLoading(true);

    const run = () => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      requestJson<CurrentlyPlayingResponse>(`${apiBase}/spotify/currently-playing`, controller.signal).then((data) => {
        if (!isMounted) {
          return;
        }
        if (!data || !data.playback) {
          setPlayback(null);
          setIsNowPlayingLoading(false);
          return;
        }
        setPlayback(data.playback);
        setIsNowPlayingLoading(false);
      });
    };

    run();
    const interval = window.setInterval(run, 5000);

    return () => {
      isMounted = false;
      if (controller) {
        controller.abort();
      }
      window.clearInterval(interval);
    };
  }, [apiBase]);

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    setIsPresenceLoading(true);

    const run = () => {
      if (controller) {
        controller.abort();
      }
      controller = new AbortController();
      requestJson<DiscordPresenceResponse>(`${apiBase}/discord/presence`, controller.signal)
        .then((data) => {
          if (!isMounted) {
            return;
          }
          const incoming = data?.presence?.activities ?? [];
          const filtered = incoming.filter((activity) => activity.type !== 2);
          setActivities(filtered);
        })
        .finally(() => {
          if (isMounted) {
            setIsPresenceLoading(false);
          }
        });
    };

    run();
    const interval = window.setInterval(run, 10000);

    return () => {
      isMounted = false;
      if (controller) {
        controller.abort();
      }
      window.clearInterval(interval);
    };
  }, [apiBase]);

  const showProgressBar = useMemo(() => {
    if (!playback || !playback.isPlaying) {
      return false;
    }
    if (!playback.track || playback.track.durationMs <= 0) {
      return false;
    }
    return playback.progressMs !== null;
  }, [playback]);

  const progressPercent = useMemo(() => {
    if (!showProgressBar || !playback || !playback.track) {
      return 0;
    }
    const progress = playback.progressMs ?? 0;
    const duration = playback.track.durationMs;
    if (duration <= 0) {
      return 0;
    }
    const ratio = (progress / duration) * 100;
    if (ratio < 0) {
      return 0;
    }
    if (ratio > 100) {
      return 100;
    }
    return ratio;
  }, [playback, showProgressBar]);

  const progressLabel = useMemo(() => {
    if (!showProgressBar || !playback || !playback.track) {
      return null;
    }
    if (playback.progressMs === null) {
      return null;
    }
    return {
      current: formatMsToTime(playback.progressMs),
      total: formatMsToTime(playback.track.durationMs),
    };
  }, [playback, showProgressBar]);

  const artistsLabel = (track: SpotifyTrack | null): string => {
    if (!track) {
      return "";
    }
    return track.artists.map((artist) => artist.name).join(", ");
  };

  return (
    <section id="activity" className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
      <div className="absolute inset-0 [background-size:28px_28px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]">
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h2 className={`${geist.className} text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mt-16 sm:mt-20 md:mt-24`}>
            {t("title")}
          </h2>
        </div>
      </div>

      <div className="relative z-10 px-6 -mt-10 sm:-mt-16 md:-mt-24 pb-20">
        <div className="mx-auto w-full max-w-7xl space-y-20">
          <div className="space-y-10">
            <SectionHeader accent={t("sections.nowPlayingAccent")} title={t("sections.nowPlaying")} />
            <div className="relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-white/70 backdrop-blur-md shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/70">
              {playback?.track?.album.imageUrl ? (
                <Image
                  src={playback.track.album.imageUrl}
                  alt={playback.track.album.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="pointer-events-none select-none object-cover opacity-10"
                />
              ) : null}
              <div className="relative flex flex-col gap-10 p-8 sm:p-10 md:flex-row md:items-center">
                {playback?.track?.album.imageUrl ? (
                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-3xl border border-white/20 shadow-inner shadow-neutral-900/30 dark:border-neutral-700/60">
                    <Image
                      src={playback.track.album.imageUrl}
                      alt={playback.track.album.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex w-full flex-col gap-6">
                  {playback && playback.track ? (
                    <>
                      <div className="space-y-2">
                        <p className={`${geist.className} text-sm uppercase tracking-[0.22em] text-emerald-500/90`}>
                          {t("sections.nowPlayingAccent")}
                        </p>
                        <h4 className={`${geist.className} text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-neutral-50`}>
                          {playback.track.name}
                        </h4>
                        <p className="text-base text-neutral-600 dark:text-neutral-300">
                          {artistsLabel(playback.track)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {playback.track.externalUrl ? (
                          <Button
                            asChild
                            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
                          >
                            <Link href={playback.track.externalUrl} target="_blank" rel="noreferrer">
                              {t("labels.playInSpotify")}
                            </Link>
                          </Button>
                        ) : null}
                        {progressLabel ? (
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {progressLabel.current} / {progressLabel.total}
                          </span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="text-base text-neutral-600 dark:text-neutral-300">
                      {isNowPlayingLoading ? tCommon("loading") : t("empty.notPlaying")}
                    </p>
                  )}
                </div>
              </div>
              {showProgressBar ? (
                <div className="relative z-10 px-8 pb-8 sm:px-10">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-400"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-10">
            <SectionHeader accent={t("sections.topTracksAccent")} title={t("sections.topTracks")} />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {isTopTracksLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`track-skeleton-${index}`}
                      className="min-h-[220px] rounded-3xl border border-neutral-200/70 bg-white/60 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60"
                    >
                      <div className="h-full animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-800/70" />
                    </div>
                  ))
                : null}
              {!isTopTracksLoading && topTracks.length === 0 ? (
                <p className="col-span-full text-neutral-600 dark:text-neutral-300">{t("empty.noTracks")}</p>
              ) : null}
              {!isTopTracksLoading
                ? topTracks.map((track, index) => {
                    const rank = typeof track.rank === "number" ? track.rank : index + 1;
                    return (
                      <div
                        key={track.id}
                        className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/70 backdrop-blur-md shadow-md transition hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/70"
                      >
                        {track.album.imageUrl ? (
                          <Image
                            src={track.album.imageUrl}
                            alt={track.album.name}
                            fill
                            sizes="(max-width:768px) 100vw, 20vw"
                            className="pointer-events-none select-none object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />
                        <div className="relative flex h-full flex-col justify-between gap-6 p-6">
                          <div className="space-y-3 text-white">
                            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-emerald-300">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
                                #{rank}
                              </span>
                              <span className={`${geist.className}`}>{t("sections.topTracksAccent").toUpperCase()}</span>
                            </div>
                            <h4 className={`${geist.className} text-xl font-semibold leading-tight`}>{track.name}</h4>
                            <p className="text-sm text-white/80">{artistsLabel(track)}</p>
                          </div>
                          {track.externalUrl ? (
                            <Button
                              asChild
                              size="sm"
                              className="w-fit rounded-full bg-white/80 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-900 transition hover:bg-white"
                            >
                              <Link href={track.externalUrl} target="_blank" rel="noreferrer">
                                {t("labels.playInSpotify")}
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                : null}
            </div>
          </div>

          <div className="space-y-10">
            <SectionHeader accent={t("sections.presenceAccent")} title={t("sections.presence")} />
            <div className="space-y-4">
              {isPresenceLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={`presence-skeleton-${index}`}
                      className="h-24 rounded-3xl border border-neutral-200/70 bg-white/60 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60"
                    >
                      <div className="h-full animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-800/70" />
                    </div>
                  ))}
                </div>
              ) : null}
              {!isPresenceLoading && activities.length === 0 ? (
                <p className="text-neutral-600 dark:text-neutral-300">{t("empty.noActivities")}</p>
              ) : null}
              {!isPresenceLoading
                ? activities.map((activity) => {
                    const cover = activity.assets?.large?.url ?? activity.assets?.small?.url ?? null;
                    return (
                      <div
                        key={activity.id}
                        className="relative flex gap-5 rounded-3xl border border-neutral-200/70 bg-white/70 p-6 backdrop-blur-md shadow-md transition hover:shadow-lg dark:border-neutral-800/80 dark:bg-neutral-900/70"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-100 dark:border-neutral-800/60 dark:bg-neutral-800/70">
                          {cover ? (
                            <Image src={cover} alt={activity.name} fill sizes="64px" className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                              {activity.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col justify-center gap-1">
                          <h4 className={`${geist.className} text-lg font-semibold text-neutral-900 dark:text-neutral-50`}>{activity.name}</h4>
                          {activity.details ? (
                            <p className="truncate text-sm text-neutral-600 dark:text-neutral-300">{activity.details}</p>
                          ) : null}
                          {activity.state ? (
                            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{activity.state}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

