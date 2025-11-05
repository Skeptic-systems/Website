import { spotifyEnv } from "../config/env";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks";
const SPOTIFY_CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
};

type SpotifyImage = {
  url: string;
  width: number;
  height: number;
};

type SpotifyApiTrack = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
};

type SpotifyTopTracksResponse = {
  items: SpotifyApiTrack[];
};

type SpotifyCurrentlyPlayingResponse = {
  item: SpotifyApiTrack | null;
  is_playing: boolean;
  progress_ms: number | null;
  currently_playing_type: string | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  durationMs: number;
  previewUrl: string | null;
  externalUrl: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
};

export type SpotifyTopTrack = SpotifyTrack & {
  rank: number;
};

export type SpotifyCurrentlyPlaying = {
  isPlaying: boolean;
  progressMs: number | null;
  currentlyPlayingType: string | null;
  track: SpotifyTrack | null;
};

const TOP_TRACKS_CACHE_TTL_MS = 5 * 60 * 1000;
const CURRENTLY_PLAYING_CACHE_TTL_MS = 5 * 1000;

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

const sanitizeSpotifyError = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as {
      error?: unknown;
      error_description?: unknown;
    };

    if (typeof parsed.error_description === "string" && parsed.error_description.length > 0) {
      return parsed.error_description;
    }

    if (typeof parsed.error === "string" && parsed.error.length > 0) {
      return parsed.error;
    }
  } catch {
    // Ignore JSON parse errors and fall back to raw text
  }

  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
};

const requestAccessToken = async (): Promise<string> => {
  const credentials = Buffer.from(
    `${spotifyEnv.clientId}:${spotifyEnv.clientSecret}`,
    "utf-8"
  ).toString("base64");

  const body = new URLSearchParams([
    ["grant_type", "refresh_token"],
    ["refresh_token", spotifyEnv.refreshToken],
  ]);

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const safeMessage = sanitizeSpotifyError(errorBody);

    throw new Error(
      `Failed to refresh Spotify access token: ${response.status} ${response.statusText} - ${safeMessage}`
    );
  }

  const payload = (await response.json()) as SpotifyTokenResponse;

  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    throw new Error("Spotify token response did not include an access token");
  }

  return payload.access_token;
};

const mapTrackBase = (track: SpotifyApiTrack): SpotifyTrack => ({
  id: track.id,
  name: track.name,
  durationMs: track.duration_ms,
  previewUrl: track.preview_url,
  externalUrl: track.external_urls.spotify,
  artists: track.artists.map((artist) => ({
    id: artist.id,
    name: artist.name,
  })),
  album: {
    id: track.album.id,
    name: track.album.name,
    imageUrl:
      track.album.images.length > 0 ? track.album.images[0]!.url : null,
  },
});

const mapTopTrack = (track: SpotifyApiTrack, index: number): SpotifyTopTrack => ({
  ...mapTrackBase(track),
  rank: index + 1,
});

const fetchSpotifyTopTracksLive = async (
  accessToken?: string
): Promise<SpotifyTopTrack[]> => {
  const token = typeof accessToken === "string" ? accessToken : await requestAccessToken();

  const url = new URL(SPOTIFY_TOP_TRACKS_URL);
  url.searchParams.set("limit", "5");
  url.searchParams.set("time_range", "short_term");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const safeMessage = sanitizeSpotifyError(errorBody);
    throw new Error(
      `Failed to fetch Spotify top tracks: ${response.status} ${response.statusText} - ${safeMessage}`
    );
  }

  const payload = (await response.json()) as SpotifyTopTracksResponse;

  if (!Array.isArray(payload.items)) {
    throw new Error("Spotify top tracks response is missing track items");
  }

  return payload.items.slice(0, 5).map(mapTopTrack);
};

const fetchSpotifyCurrentlyPlayingLive = async (
  accessToken?: string
): Promise<SpotifyCurrentlyPlaying> => {
  const token = typeof accessToken === "string" ? accessToken : await requestAccessToken();

  const response = await fetch(SPOTIFY_CURRENTLY_PLAYING_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return {
      isPlaying: false,
      progressMs: null,
      currentlyPlayingType: null,
      track: null,
    };
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const safeMessage = sanitizeSpotifyError(errorBody);
    throw new Error(
      `Failed to fetch Spotify currently playing track: ${response.status} ${response.statusText} - ${safeMessage}`
    );
  }

  const payload = (await response.json()) as SpotifyCurrentlyPlayingResponse;

  return {
    isPlaying: Boolean(payload.is_playing),
    progressMs: typeof payload.progress_ms === "number" ? payload.progress_ms : null,
    currentlyPlayingType:
      typeof payload.currently_playing_type === "string"
        ? payload.currently_playing_type
        : null,
    track: payload.item ? mapTrackBase(payload.item) : null,
  };
};

const getCachedSpotifyTopTracks = createCachedFetcher(
  () => fetchSpotifyTopTracksLive(),
  TOP_TRACKS_CACHE_TTL_MS
);

const getCachedSpotifyCurrentlyPlaying = createCachedFetcher(
  () => fetchSpotifyCurrentlyPlayingLive(),
  CURRENTLY_PLAYING_CACHE_TTL_MS
);

export const fetchSpotifyTopTracks = async (): Promise<SpotifyTopTrack[]> =>
  getCachedSpotifyTopTracks();

export const fetchSpotifyCurrentlyPlaying = async (): Promise<SpotifyCurrentlyPlaying> =>
  getCachedSpotifyCurrentlyPlaying();

const verifySpotifyScopes = async (accessToken: string): Promise<void> => {
  const [topTracksResult, currentlyPlayingResult] = await Promise.allSettled([
    fetchSpotifyTopTracksLive(accessToken),
    fetchSpotifyCurrentlyPlayingLive(accessToken),
  ]);

  const scopeIssues: string[] = [];

  if (topTracksResult.status === "rejected") {
    const reason = topTracksResult.reason instanceof Error
      ? topTracksResult.reason.message
      : String(topTracksResult.reason);
    scopeIssues.push(`user-top-read (${reason})`);
  }

  if (currentlyPlayingResult.status === "rejected") {
    const reason = currentlyPlayingResult.reason instanceof Error
      ? currentlyPlayingResult.reason.message
      : String(currentlyPlayingResult.reason);
    scopeIssues.push(`user-read-currently-playing (${reason})`);
  }

  if (scopeIssues.length > 0) {
    throw new Error(`Missing Spotify scopes: ${scopeIssues.join(", ")}`);
  }
};

export const verifySpotifyConnection = async (): Promise<void> => {
  const accessToken = await requestAccessToken();
  await verifySpotifyScopes(accessToken);
};

