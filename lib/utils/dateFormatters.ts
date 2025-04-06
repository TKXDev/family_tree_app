import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats a date string to a human-readable date and time
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "April 29, 2023, 1:30 PM")
 */
export const formatDate = (dateString: string) => {
  try {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "PPP p"); // Example: April 29, 2023, 1:30 PM
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Formats a date string to a "time ago" format
 * @param dateString - The date string to format
 * @returns Formatted time ago string (e.g., "2 hours ago")
 */
export const formatTimeAgo = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Unknown";
  }
};

/**
 * Formats a date string to a short date format
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatShortDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Formats a date string to ISO date format (YYYY-MM-DD)
 * @param dateString - The date string to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatISODate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  } catch (error) {
    return "";
  }
};
