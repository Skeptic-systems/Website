"use client";

import { createAuthClient } from "better-auth/react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}

const normalizedBaseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

export const authClient = createAuthClient({
  baseURL: `${normalizedBaseUrl}/auth`,
});
