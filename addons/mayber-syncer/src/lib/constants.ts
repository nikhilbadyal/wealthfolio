import type { MaybeImporterSettings } from "../types/maybe";

// Keep the route in one place so addon registration and navigation copy cannot drift.
export const ADDON_ROUTE = "/addons/maybe-importer";

// Preserve prototype secret keys so early testers keep their saved API settings.
export const SECRET_API_KEY = "legacy_api_key";

// Preserve prototype secret keys so early testers keep their saved API settings.
export const SECRET_BASE_URL = "legacy_base_url";

// Default to blank settings so no personal Maybe endpoint is baked into the addon.
export const DEFAULT_SETTINGS: MaybeImporterSettings = {
  baseUrl: "",
  apiKey: "",
};

// Store source markers in comments because ActivityImport does not expose arbitrary source metadata.
export const MAYBE_ID_PATTERN = /\[maybe_id:([^\]]+)\]/;

// Use INR as the fallback because this importer was originally built for INR Maybe data.
export const DEFAULT_CURRENCY = "INR";
