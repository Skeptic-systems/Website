import { cookies } from "next/headers";

import type { AuthenticatedProfile } from "./types";

const apiBaseCandidates = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_INTERNAL_API_URL,
].filter((value): value is string => typeof value === "string" && value.length > 0);

if (apiBaseCandidates.length === 0) {
  throw new Error("Missing NEXT_PUBLIC_API_URL (or NEXT_INTERNAL_API_URL) for auth session lookups");
}

type ProfileResponse = {
  user: AuthenticatedProfile;
};

const fetchProfileFromBase = async (
  baseUrl: string,
  cookieHeader: string,
): Promise<AuthenticatedProfile | null> => {
  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      cookie: cookieHeader,
      Accept: "application/json",
    },
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ProfileResponse;
  return payload.user;
};

export const readServerProfile = async (): Promise<AuthenticatedProfile | null> => {
  const cookieStore = await cookies();
  const cookieEntries = cookieStore.getAll();
  const serializedCookies =
    cookieEntries.length === 0
      ? null
      : cookieEntries.map(({ name, value }) => `${name}=${value}`).join("; ");

  if (!serializedCookies) {
    return null;
  }

  for (const baseUrl of apiBaseCandidates) {
    try {
      const profile = await fetchProfileFromBase(baseUrl, serializedCookies);
      if (profile) {
        return profile;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[auth] Failed to read profile from ${baseUrl}`, error);
      }
    }
  }

  return null;
};

