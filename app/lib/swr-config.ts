import { SWRConfig as SWRConfigProvider } from "swr";

/**
 * Default fetcher for SWR
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Global SWR configuration
 */
export const swrConfig = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds
  shouldRetryOnError: (err: any) => {
    // Don't retry for 404s or other client errors
    return !(err?.status >= 400 && err?.status < 500);
  },
  onError: (err: any) => {
    console.error("SWR Error:", err);
  },
};
