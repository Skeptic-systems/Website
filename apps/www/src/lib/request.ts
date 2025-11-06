type FetchJsonOptions = {
  signal?: AbortSignal;
};

export async function requestJson<T>(
  input: string,
  options?: FetchJsonOptions
): Promise<T | null> {
  try {
    const response = await fetch(input, {
      signal: options?.signal,
      headers: {
        Accept: "application/json",
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

    console.error(error);
    return null;
  }
}


