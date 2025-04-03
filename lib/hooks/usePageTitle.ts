import { useEffect } from "react";

/**
 * A custom hook to set the document title with an optional app name suffix
 * @param title - The page-specific title
 * @param withAppName - Whether to append the app name (defaults to true)
 */
export function usePageTitle(title: string, withAppName = true) {
  useEffect(() => {
    // Set the base title
    let fullTitle = title;

    // Optionally append app name
    if (withAppName) {
      fullTitle += " | Family Tree App";
    }

    // Update the document title
    document.title = fullTitle;

    // Restore the original title when the component unmounts
    return () => {
      // Optional: Reset to default if needed
    };
  }, [title, withAppName]);
}

/**
 * A more advanced version of usePageTitle that handles loading and error states
 */
export function useDynamicPageTitle({
  title,
  loading,
  error,
  count,
  searchQuery,
  searchResults,
  withAppName = true,
}: {
  title: string;
  loading?: boolean;
  error?: Error | string | null;
  count?: number;
  searchQuery?: string;
  searchResults?: any[] | null;
  withAppName?: boolean;
}) {
  useEffect(() => {
    let fullTitle = "";

    // Handle various states
    if (loading) {
      fullTitle = `Loading ${title}...`;
    } else if (error) {
      fullTitle = `Error - ${title}`;
    } else if (searchQuery && searchResults) {
      fullTitle = `Search: ${searchQuery} (${searchResults.length} results) - ${title}`;
    } else if (count !== undefined) {
      fullTitle = `${title} - ${count} items`;
    } else {
      fullTitle = title;
    }

    // Optionally append app name
    if (withAppName) {
      fullTitle += " | Family Tree App";
    }

    // Update the document title
    document.title = fullTitle;
  }, [title, loading, error, count, searchQuery, searchResults, withAppName]);
}
