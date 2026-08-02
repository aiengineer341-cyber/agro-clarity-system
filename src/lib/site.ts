/** Canonical public origin. Override per deployment with VITE_SITE_URL. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://ugagroscan.app"
).replace(/\/$/, "");

export const SITE_NAME = "UG AgroScan";

export const canonical = (path = "/") => `${SITE_URL}${path}`;