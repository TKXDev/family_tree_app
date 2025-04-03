import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Interface for the state managed by the useApi hook
 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
}

/**
 * Extended error class for API errors with additional context
 */
export class ApiError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Options for the useApi hook
 */
interface UseApiOptions {
  cacheTime?: number; // How long to cache results in ms (0 = no cache)
  retries?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
}

/**
 * Custom hook for handling API calls with advanced features
 */
export function useApi<T>(options: UseApiOptions = {}) {
  const { cacheTime = 0, retries = 0, retryDelay = 1000 } = options;

  // State for API call
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Refs for managing ongoing calls
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const pendingPromiseRef = useRef<Promise<T> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Abort any ongoing calls on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Main execute function enhanced with caching, retries, and abort support
  const execute = useCallback(
    async (apiCall: (signal?: AbortSignal) => Promise<T>): Promise<T> => {
      // Check cache if enabled
      if (
        cacheTime > 0 &&
        state.data &&
        state.lastUpdated &&
        Date.now() - state.lastUpdated < cacheTime
      ) {
        return state.data;
      }

      // Abort any previous call
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // If there's a pending promise with the same call, return it
      if (pendingPromiseRef.current) {
        return pendingPromiseRef.current;
      }

      // Set loading state
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Create and store the promise
      const executePromise = (async () => {
        let attempts = 0;
        let lastError: Error | null = null;

        // Try the call with retries
        while (attempts <= retries) {
          try {
            const data = await apiCall(signal);

            // Only update state if the component is still mounted
            if (isMountedRef.current && !signal.aborted) {
              setState({
                data,
                loading: false,
                error: null,
                lastUpdated: Date.now(),
              });
            }

            // Clear the pending promise reference
            pendingPromiseRef.current = null;
            return data;
          } catch (error) {
            lastError =
              error instanceof Error
                ? error
                : new ApiError("An unknown error occurred");

            // If aborted, don't retry
            if (signal.aborted) {
              break;
            }

            // Last attempt, throw the error
            if (attempts === retries) {
              break;
            }

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            attempts++;
          }
        }

        // Handle error case
        if (isMountedRef.current && !signal.aborted) {
          setState({
            data: null,
            loading: false,
            error: lastError,
            lastUpdated: null,
          });
        }

        // Clear the pending promise reference
        pendingPromiseRef.current = null;
        throw lastError;
      })();

      pendingPromiseRef.current = executePromise;
      return executePromise;
    },
    [cacheTime, retries, retryDelay, state.data, state.lastUpdated]
  );

  // Abort the current call
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: new ApiError("Request aborted", 0, { aborted: true }),
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
  }, []);

  return {
    ...state,
    execute,
    abort,
    reset,
    isStale:
      cacheTime > 0 && state.lastUpdated
        ? Date.now() - state.lastUpdated > cacheTime
        : true,
  };
}
