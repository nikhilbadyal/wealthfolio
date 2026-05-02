import type { AddonContext } from "@wealthfolio/addon-sdk";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SECRET_API_KEY, SECRET_BASE_URL } from "../lib/constants";
import { createMaybeApiClient } from "../lib/maybe-api";
import type { MaybeImporterSettings, MaybeUsageResponse } from "../types/maybe";

// Keep secret loading separate from import execution so settings can be tested and reasoned about independently.
export function useMaybeImporterSettings(ctx: AddonContext) {
  const [settings, setSettings] = useState<MaybeImporterSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUsage, setVerifiedUsage] = useState<MaybeUsageResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      try {
        const [savedApiKey, savedBaseUrl] = await Promise.all([
          ctx.api.secrets.get(SECRET_API_KEY),
          ctx.api.secrets.get(SECRET_BASE_URL),
        ]);

        if (ignore) {
          return;
        }

        setSettings({
          baseUrl: savedBaseUrl ?? DEFAULT_SETTINGS.baseUrl,
          apiKey: savedApiKey ?? DEFAULT_SETTINGS.apiKey,
        });
        setError(null);
        setVerifiedUsage(null);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : String(loadError);

        if (!ignore) {
          setError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      ignore = true;
    };
  }, [ctx]);

  // Merge partial edits so individual fields can update without duplicating form state.
  const updateSettings = (nextSettings: Partial<MaybeImporterSettings>) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
    setIsSaved(false);
    setVerifiedUsage(null);
  };

  // Verify credentials before storage so invalid keys do not replace a known-good saved setup.
  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const trimmedSettings = {
        baseUrl: settings.baseUrl.trim(),
        apiKey: settings.apiKey.trim(),
      };

      if (!trimmedSettings.baseUrl || !trimmedSettings.apiKey) {
        throw new Error("Enter both the Maybe API base URL and API key before saving.");
      }

      const maybeApi = createMaybeApiClient(trimmedSettings, () => undefined);
      const usage = await maybeApi.fetchUsage();

      await Promise.all([
        ctx.api.secrets.set(SECRET_BASE_URL, trimmedSettings.baseUrl),
        ctx.api.secrets.set(SECRET_API_KEY, trimmedSettings.apiKey),
      ]);

      setSettings(trimmedSettings);
      setVerifiedUsage(usage);
      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 2000);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : String(saveError);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    isSaved,
    error,
    verifiedUsage,
    updateSettings,
    saveSettings,
  };
}
