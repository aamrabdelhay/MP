/**
 * Private production mode switch.
 * Keep attendance as the default. The cookie storefront stays unavailable until
 * the user explicitly asks to activate it; switching this value is the only
 * public-site mode change required.
 */
export const SITE_MODE: "attendance" | "cookies" = "attendance";
