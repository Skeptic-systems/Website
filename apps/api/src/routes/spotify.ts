import { Hono } from "hono";

import type { SpotifyCurrentlyPlaying, SpotifyTopTrack } from "../services/spotify";
import { fetchSpotifyCurrentlyPlaying, fetchSpotifyTopTracks } from "../services/spotify";

export const spotifyRoutes = new Hono();

spotifyRoutes.get("/top-tracks", async (c) => {
  try {
    const tracks = await fetchSpotifyTopTracks();

    return c.json<{ tracks: SpotifyTopTrack[] }>({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🎵 [spotify] Failed to load top tracks: ${message}`);

    return c.json({ error: "Failed to fetch Spotify top tracks" }, 502);
  }
});

spotifyRoutes.get("/currently-playing", async (c) => {
  try {
    const playback = await fetchSpotifyCurrentlyPlaying();

    return c.json<{ playback: SpotifyCurrentlyPlaying }>({ playback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`🎶 [spotify] Failed to load currently playing track: ${message}`);

    return c.json({ error: "Failed to fetch Spotify playback" }, 502);
  }
});

