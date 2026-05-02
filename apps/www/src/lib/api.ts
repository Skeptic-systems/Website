export function getApiBaseUrl(): string {
  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!rawApiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
  }

  return rawApiBaseUrl.endsWith("/") ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;
}
