import { discordEnv } from "../config/env";

const DEFAULT_LANYARD_ROUTE = "/v1/users/";
const PRESENCE_CACHE_TTL_MS = 5 * 1000;

type LanyardDiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
};

type LanyardActivity = {
  id?: string | null;
  name: string;
  type: number;
  application_id?: string | null;
  state?: string | null;
  details?: string | null;
  url?: string | null;
  created_at?: number | null;
  timestamps?: {
    start?: number | null;
    end?: number | null;
  } | null;
  assets?: {
    large_image?: string | null;
    large_text?: string | null;
    small_image?: string | null;
    small_text?: string | null;
  } | null;
  buttons?: string[] | null;
};

type LanyardSpotify = {
  track_id: string;
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  timestamps?: {
    start?: number | null;
    end?: number | null;
  } | null;
};

type LanyardPresence = {
  discord_user: LanyardDiscordUser;
  discord_status: string;
  activities: LanyardActivity[];
  active_on_discord_mobile: boolean;
  active_on_discord_desktop: boolean;
  active_on_discord_web: boolean;
  listening_to_spotify: boolean;
  spotify?: LanyardSpotify | null;
};

type LanyardResponse = {
  success: boolean;
  data?: LanyardPresence;
  error?: string;
};

export type DiscordActivityAsset = {
  key: string | null;
  text: string | null;
  url: string | null;
};

export type DiscordActivity = {
  id: string | null;
  name: string;
  type: number;
  applicationId: string | null;
  state: string | null;
  details: string | null;
  url: string | null;
  createdAt: number | null;
  timestamps: {
    start: number | null;
    end: number | null;
  };
  buttons: string[];
  assets: {
    large: DiscordActivityAsset;
    small: DiscordActivityAsset;
  };
};

export type DiscordSpotifyPresence = {
  trackId: string;
  song: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  timestamps: {
    start: number | null;
    end: number | null;
  };
};

export type DiscordPresence = {
  status: string;
  activities: DiscordActivity[];
  primaryActivity: DiscordActivity | null;
  user: {
    id: string;
    username: string;
    discriminator: string | null;
    globalName: string | null;
    avatarUrl: string | null;
  };
  activeOnDesktop: boolean;
  activeOnMobile: boolean;
  activeOnWeb: boolean;
  listeningToSpotify: boolean;
  spotify: DiscordSpotifyPresence | null;
};

type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

const createCachedFetcher = <T>(fetcher: () => Promise<T>, ttlMs: number) => {
  let cache: CacheEntry<T> | null = null;
  let inflight: Promise<T> | null = null;

  return async (): Promise<T> => {
    const now = Date.now();

    if (cache !== null && now - cache.fetchedAt < ttlMs) {
      return cache.value;
    }

    if (inflight === null) {
      inflight = fetcher()
        .then((value) => {
          cache = { value, fetchedAt: Date.now() };
          return value;
        })
        .finally(() => {
          inflight = null;
        });
    }

    return inflight;
  };
};

const resolveDiscordCdnAsset = (applicationId: string | null, assetKey: string | null): string | null => {
  if (assetKey === null || typeof assetKey !== "string" || assetKey.length === 0) {
    return null;
  }

  if (assetKey.startsWith("https://")) {
    return assetKey;
  }

  if (assetKey.startsWith("spotify:")) {
    const identifier = assetKey.slice("spotify:".length);
    if (identifier.length === 0) {
      return null;
    }
    return `https://i.scdn.co/image/${identifier}`;
  }

  if (assetKey.startsWith("mp:")) {
    const normalized = assetKey.slice("mp:".length);
    if (normalized.length === 0) {
      return null;
    }
    return `https://media.discordapp.net/${normalized}`;
  }

  if (applicationId === null || applicationId.length === 0) {
    return null;
  }

  return `https://cdn.discordapp.com/app-assets/${applicationId}/${assetKey}.png`;
};

const buildDiscordAvatarUrl = (user: LanyardDiscordUser): string | null => {
  if (typeof user.avatar === "string" && user.avatar.length > 0) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=256`;
  }

  const discriminator = Number.parseInt(user.discriminator, 10);

  if (Number.isNaN(discriminator)) {
    return null;
  }

  const fallbackIndex = discriminator % 5;
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
};

const mapActivityAsset = (
  applicationId: string | null,
  assetKey: string | null,
  assetText: string | null
): DiscordActivityAsset => ({
  key: assetKey,
  text: assetText,
  url: resolveDiscordCdnAsset(applicationId, assetKey),
});

const mapActivity = (activity: LanyardActivity): DiscordActivity => {
  const applicationId = typeof activity.application_id === "string" && activity.application_id.length > 0
    ? activity.application_id
    : null;

  const timestamps = activity.timestamps ?? null;

  return {
    id: typeof activity.id === "string" && activity.id.length > 0 ? activity.id : null,
    name: activity.name,
    type: activity.type,
    applicationId,
    state: activity.state ?? null,
    details: activity.details ?? null,
    url: activity.url ?? null,
    createdAt: typeof activity.created_at === "number" ? activity.created_at : null,
    timestamps: {
      start:
        timestamps && typeof timestamps.start === "number"
          ? timestamps.start
          : null,
      end:
        timestamps && typeof timestamps.end === "number"
          ? timestamps.end
          : null,
    },
    buttons: Array.isArray(activity.buttons)
      ? activity.buttons.filter((button): button is string => typeof button === "string" && button.length > 0)
      : [],
    assets: {
      large: mapActivityAsset(
        applicationId,
        activity.assets?.large_image ?? null,
        activity.assets?.large_text ?? null
      ),
      small: mapActivityAsset(
        applicationId,
        activity.assets?.small_image ?? null,
        activity.assets?.small_text ?? null
      ),
    },
  };
};

const mapSpotifyPresence = (spotify: LanyardSpotify | null | undefined): DiscordSpotifyPresence | null => {
  if (!spotify) {
    return null;
  }

  return {
    trackId: spotify.track_id,
    song: spotify.song,
    artist: spotify.artist,
    album: spotify.album,
    albumArtUrl: spotify.album_art_url,
    timestamps: {
      start:
        spotify.timestamps && typeof spotify.timestamps.start === "number"
          ? spotify.timestamps.start
          : null,
      end:
        spotify.timestamps && typeof spotify.timestamps.end === "number"
          ? spotify.timestamps.end
          : null,
    },
  };
};

const mapPresence = (payload: LanyardPresence): DiscordPresence => {
  const activities = Array.isArray(payload.activities)
    ? payload.activities.map(mapActivity)
    : [];

  const primaryActivity = activities.find((activity) => activity.type !== 4) ?? null;

  return {
    status: payload.discord_status,
    activities,
    primaryActivity,
    user: {
      id: payload.discord_user.id,
      username: payload.discord_user.username,
      discriminator: null,
      globalName: payload.discord_user.global_name ?? null,
      avatarUrl: buildDiscordAvatarUrl(payload.discord_user),
    },
    activeOnDesktop: Boolean(payload.active_on_discord_desktop),
    activeOnMobile: Boolean(payload.active_on_discord_mobile),
    activeOnWeb: Boolean(payload.active_on_discord_web),
    listeningToSpotify: Boolean(payload.listening_to_spotify),
    spotify: mapSpotifyPresence(payload.spotify ?? null),
  };
};

const fetchDiscordPresenceLive = async (): Promise<DiscordPresence> => {
  const url = new URL(discordEnv.apiBaseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${DEFAULT_LANYARD_ROUTE}${discordEnv.userId}`;
  url.searchParams.set("hideSpotify", "true");
  url.searchParams.set("hideTag", "true");

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to fetch Discord presence: ${response.status} ${response.statusText} - ${body.slice(0, 200)}`
    );
  }

  const payload = (await response.json()) as LanyardResponse;

  if (!payload.success || !payload.data) {
    const reason = typeof payload.error === "string" && payload.error.length > 0
      ? payload.error
      : "Unknown Lanyard response";
    throw new Error(`Lanyard returned an error: ${reason}`);
  }

  return mapPresence(payload.data);
};

const getCachedDiscordPresence = createCachedFetcher(
  () => fetchDiscordPresenceLive(),
  PRESENCE_CACHE_TTL_MS
);

export const fetchDiscordPresence = async (): Promise<DiscordPresence> =>
  getCachedDiscordPresence();

export const verifyDiscordConnection = async (): Promise<void> => {
  await fetchDiscordPresenceLive();
};


