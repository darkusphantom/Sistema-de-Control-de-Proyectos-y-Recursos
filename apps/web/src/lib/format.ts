/**
 * Parses an ISO 8601 date string into a Date object.
 *
 * Date-only strings (YYYY-MM-DD) are interpreted as local midnight because
 * the Date constructor parses them as UTC, which shifts the day in
 * timezones behind UTC. Full timestamps are parsed as-is.
 *
 * @param isoDate - ISO 8601 date string to parse.
 * @returns The parsed Date object.
 * @complexity O(1) — constant-time parsing.
 */
function parseDate(isoDate: string): Date {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (dateOnlyPattern.test(isoDate)) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(isoDate);
}

/**
 * Formats an ISO 8601 date string into a localized, human-readable date.
 *
 * @param isoDate - ISO 8601 date string to format.
 * @param locale - BCP 47 locale tag used for formatting (defaults to "es-ES").
 * @returns The formatted date, or "Invalid date" when the input cannot be parsed.
 * @complexity O(1) — single Intl.DateTimeFormat call.
 */
export function formatDate(isoDate: string, locale = "es-ES"): string {
  const date = parseDate(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Truncates a text to a maximum number of characters, appending an ellipsis.
 *
 * @param text - The text to truncate.
 * @param maxLength - Maximum number of characters to keep (defaults to 160).
 * @returns The truncated text with an ellipsis, or the original text when it fits.
 * @complexity O(n) — single slice over the input string.
 */
export function truncateText(text: string, maxLength = 160): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}
