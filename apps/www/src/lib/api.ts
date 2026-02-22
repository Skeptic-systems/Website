const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}

export const apiBaseUrl = rawApiBaseUrl.endsWith("/") ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;







