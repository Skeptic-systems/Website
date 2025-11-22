type FetchJsonOptions = {
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
};

export async function requestJson<T>(input: string, options?: FetchJsonOptions): Promise<T | null> {
  try {
    const response = await fetch(input, {
      signal: options?.signal,
      credentials: options?.credentials,
      headers: {
        Accept: "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (options?.signal && error instanceof DOMException && error.name === "AbortError") {
      return null;
    }

    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[requestJson] Failed to fetch ${input}`, error);
    }
    return null;
  }
}