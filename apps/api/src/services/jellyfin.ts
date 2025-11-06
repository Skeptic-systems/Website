import { jellyfinEnv } from "../config/env";

const DEFAULT_CLIENT_NAME = "WebsiteDashboard";
const DEFAULT_DEVICE_NAME = "Website API";
const DEFAULT_DEVICE_ID = "website-api";
const DEFAULT_APP_VERSION = "1.0.0";

const OVERVIEW_CACHE_TTL_MS = 30 * 1000;
const SESSIONS_CACHE_TTL_MS = 5 * 1000;

type CacheEntry<T> = {
  value: T;
  fetchedAt: number;
};

const createCachedFetcher = <T>(fetcher: () => Promise<T>, ttlMs: number) => {
  let cache: CacheEntry<T> | null = null;
  let inFlight: Promise<T> | null = null;

  return async (): Promise<T> => {
    const now = Date.now();

    if (cache !== null && now - cache.fetchedAt < ttlMs) {
      return cache.value;
    }

    if (inFlight === null) {
      inFlight = fetcher()
        .then((value) => {
          cache = { value, fetchedAt: Date.now() };
          return value;
        })
        .finally(() => {
          inFlight = null;
        });
    }

    return inFlight;
  };
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const buildAuthorizationHeader = (): string => {
  const clientName = jellyfinEnv.clientName ?? DEFAULT_CLIENT_NAME;
  const deviceName = jellyfinEnv.deviceName ?? DEFAULT_DEVICE_NAME;
  const deviceId = jellyfinEnv.deviceId ?? DEFAULT_DEVICE_ID;
  const appVersion = jellyfinEnv.appVersion ?? DEFAULT_APP_VERSION;

  const parts = [
    `Client="${clientName}"`,
    `Device="${deviceName}"`,
    `DeviceId="${deviceId}"`,
    `Version="${appVersion}"`,
    `Token="${jellyfinEnv.apiKey}"`,
  ];

  return `MediaBrowser ${parts.join(", ")}`;
};

const createJellyfinUrl = (path: string): URL => {
  if (!path.startsWith("/")) {
    throw new Error(`Jellyfin path must start with "/": ${path}`);
  }

  const url = new URL(jellyfinEnv.apiBaseUrl);
  const basePath = url.pathname === "/" ? "" : trimTrailingSlash(url.pathname);
  url.pathname = `${basePath}${path}`;
  url.search = "";

  return url;
};

type JellyfinRequestOptions = {
  search?: Record<string, string | number>;
};

const requestJellyfin = async <T>(
  path: string,
  options?: JellyfinRequestOptions
): Promise<T> => {
  const url = createJellyfinUrl(path);

  if (options?.search) {
    for (const [key, value] of Object.entries(options.search)) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: "application/json",
    "X-Emby-Authorization": buildAuthorizationHeader(),
    "X-Emby-Token": jellyfinEnv.apiKey,
    Authorization: `MediaBrowser Token=${jellyfinEnv.apiKey}`,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to reach Jellyfin at ${url.toString()}: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text();
    const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
    throw new Error(
      `Failed to fetch Jellyfin path ${path}: ${response.status} ${response.statusText} - ${preview}`
    );
  }

  if (response.status === 204) {
    throw new Error(`Jellyfin path ${path} returned no content`);
  }

  return (await response.json()) as T;
};

const ensureObject = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${label} is not an object`);
  }

  return value as Record<string, unknown>;
};

const readOptionalString = (value: unknown): string | null => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
};

const readOptionalNumber = (value: unknown): number | null => {
  if (typeof value !== "number") {
    return null;
  }

  if (!Number.isFinite(value)) {
    throw new Error("Encountered non-finite number in Jellyfin payload");
  }

  return value;
};

const readBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
};

const readCount = (payload: Record<string, unknown>, key: string): number => {
  const value = payload[key];

  if (typeof value === "undefined") {
    return 0;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric value for Jellyfin count ${key}`);
  }

  return value;
};

export type JellyfinLibraryCounts = {
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

export type JellyfinServerInfo = {
  id: string | null;
  name: string | null;
  version: string | null;
  operatingSystem: string | null;
  productName: string | null;
};

export type JellyfinNowPlaying = {
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

export type JellyfinActiveSession = {
  id: string;
  userId: string | null;
  userName: string | null;
  client: string | null;
  deviceName: string | null;
  deviceId: string | null;
  isTranscoding: boolean;
  nowPlaying: JellyfinNowPlaying | null;
};

export type JellyfinOverview = {
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

const fetchJellyfinUsersCount = async (): Promise<number> => {
  const payload = await requestJellyfin<unknown[]>("/Users");

  if (!Array.isArray(payload)) {
    throw new Error("Jellyfin users response is not an array");
  }

  return payload.length;
};

const fetchJellyfinItemCounts = async (): Promise<JellyfinLibraryCounts> => {
  const payload = await requestJellyfin<Record<string, unknown>>("/Items/Counts");

  return {
    totalItems: readCount(payload, "ItemCount"),
    movies: readCount(payload, "MovieCount"),
    series: readCount(payload, "SeriesCount"),
    seasons: readCount(payload, "SeasonCount"),
    episodes: readCount(payload, "EpisodeCount"),
    albums: readCount(payload, "AlbumCount"),
    songs: readCount(payload, "SongCount"),
    artists: readCount(payload, "ArtistCount"),
    audiobooks: readCount(payload, "BookCount"),
    boxSets: readCount(payload, "BoxSetCount"),
    games: readCount(payload, "GameCount"),
    programs: readCount(payload, "ProgramCount"),
  };
};

const mapNowPlaying = (value: unknown, playState: Record<string, unknown> | null): JellyfinNowPlaying | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const payload = value as Record<string, unknown>;

  return {
    title: readOptionalString(payload["Name"]),
    mediaType: readOptionalString(payload["MediaType"]),
    type: readOptionalString(payload["Type"]),
    seriesName: readOptionalString(payload["SeriesName"]),
    seasonName: readOptionalString(payload["SeasonName"]),
    productionYear: readOptionalNumber(payload["ProductionYear"]),
    runTimeTicks: readOptionalNumber(payload["RunTimeTicks"]),
    positionTicks: playState ? readOptionalNumber(playState["PositionTicks"]) : null,
    isPaused: playState ? readBooleanOrNull(playState["IsPaused"]) : null,
  };
};

const mapSession = (value: unknown): JellyfinActiveSession => {
  const payload = ensureObject(value, "Jellyfin session");

  const idRaw = payload["Id"];

  if (typeof idRaw !== "string" || idRaw.length === 0) {
    throw new Error("Jellyfin session is missing an Id");
  }

  const playState = payload["PlayState"]
    ? ensureObject(payload["PlayState"], "Jellyfin session play state")
    : null;

  const transcodingInfo = payload["TranscodingInfo"];
  const isTranscoding = typeof transcodingInfo === "object" && transcodingInfo !== null;

  return {
    id: idRaw,
    userId: readOptionalString(payload["UserId"]),
    userName: readOptionalString(payload["UserName"]),
    client: readOptionalString(payload["Client"]),
    deviceName: readOptionalString(payload["DeviceName"]),
    deviceId: readOptionalString(payload["DeviceId"]),
    isTranscoding,
    nowPlaying: mapNowPlaying(payload["NowPlayingItem"], playState),
  };
};

const fetchJellyfinActiveSessionsLive = async (): Promise<JellyfinActiveSession[]> => {
  const payload = await requestJellyfin<unknown[]>("/Sessions");

  if (!Array.isArray(payload)) {
    throw new Error("Jellyfin active sessions response is not an array");
  }

  return payload.map(mapSession);
};

const fetchJellyfinSystemInfo = async (): Promise<JellyfinServerInfo> => {
  const payload = await requestJellyfin<Record<string, unknown>>("/System/Info");

  return {
    id: readOptionalString(payload["Id"]),
    name: readOptionalString(payload["ServerName"]) ?? readOptionalString(payload["LocalAddress"]),
    version: readOptionalString(payload["Version"]),
    operatingSystem: readOptionalString(payload["OperatingSystem"]),
    productName: readOptionalString(payload["ProductName"]),
  };
};

const fetchJellyfinOverviewLive = async (): Promise<JellyfinOverview> => {
  const [users, libraries, sessions, server] = await Promise.all([
    fetchJellyfinUsersCount(),
    fetchJellyfinItemCounts(),
    fetchJellyfinActiveSessionsLive(),
    fetchJellyfinSystemInfo(),
  ]);

  const transcodingCount = sessions.filter((session) => session.isTranscoding).length;

  return {
    server,
    counts: {
      users,
      libraries,
    },
    sessions: {
      activeCount: sessions.length,
      transcodingCount,
    },
    generatedAt: new Date().toISOString(),
  };
};

const getCachedJellyfinActiveSessions = createCachedFetcher(
  () => fetchJellyfinActiveSessionsLive(),
  SESSIONS_CACHE_TTL_MS
);

const getCachedJellyfinOverview = createCachedFetcher(
  () => fetchJellyfinOverviewLive(),
  OVERVIEW_CACHE_TTL_MS
);

export const fetchJellyfinActiveSessions = async (): Promise<JellyfinActiveSession[]> =>
  getCachedJellyfinActiveSessions();

export const fetchJellyfinOverview = async (): Promise<JellyfinOverview> =>
  getCachedJellyfinOverview();

export const verifyJellyfinConnection = async (): Promise<void> => {
  await fetchJellyfinSystemInfo();
};


