// IST timezone helpers. Tournament times are entered & shown in Asia/Kolkata (IST, UTC+5:30).
// Storage column is timestamptz, so we convert IST <-> UTC explicitly here.

const IST_OFFSET_MIN = 330; // +5:30

/**
 * Convert an admin <input type="datetime-local"> value (e.g. "2026-05-04T12:00")
 * — interpreted as IST wall-clock — into an ISO UTC string for storage.
 */
export const istLocalInputToUtcIso = (local: string): string => {
  if (!local) return local;
  // Parse components manually to avoid the browser's local-tz interpretation.
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s = 0] = timePart.split(":").map(Number);
  // Build as UTC, then subtract IST offset to get the true UTC instant.
  const utcMs = Date.UTC(y, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, s ?? 0) - IST_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs).toISOString();
};

/**
 * Convert a stored UTC ISO timestamp into an IST "YYYY-MM-DDTHH:mm" string
 * suitable for an <input type="datetime-local"> default value.
 */
export const utcIsoToIstLocalInput = (iso: string): string => {
  if (!iso) return "";
  const ist = new Date(new Date(iso).getTime() + IST_OFFSET_MIN * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`;
};

const IST_TZ = "Asia/Kolkata";

export const formatIstDateTime = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: IST_TZ, ...opts });

export const formatIstDate = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: IST_TZ, ...opts });

export const formatIstTime = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleTimeString("en-IN", { timeZone: IST_TZ, hour: "2-digit", minute: "2-digit", hour12: true, ...opts });