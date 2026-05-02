import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icons,
  Input,
  Label,
  Skeleton,
} from "@wealthfolio/ui";
import type { MaybeImporterSettings, MaybeUsageResponse } from "../types/maybe";

interface SettingsPanelProps {
  settings: MaybeImporterSettings;
  isLoading: boolean;
  isSaving: boolean;
  isSaved: boolean;
  error: string | null;
  verifiedUsage: MaybeUsageResponse | null;
  onChange: (settings: Partial<MaybeImporterSettings>) => void;
  onSave: () => Promise<void>;
}

// Keep credential editing isolated so the page does not duplicate form markup or secret-save states.
export function SettingsPanel({
  settings,
  isLoading,
  isSaving,
  isSaved,
  error,
  verifiedUsage,
  onChange,
  onSave,
}: SettingsPanelProps) {
  if (isLoading) {
    return <SettingsPanelSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Link className="text-muted-foreground h-5 w-5" />
          Maybe API connection
        </CardTitle>
        <CardDescription>
          Credentials are stored with Wealthfolio addon secrets and used only for import requests.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <Icons.AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verifiedUsage && (
          <Alert>
            <Icons.ShieldCheck className="h-4 w-4" />
            <AlertTitle>Credentials verified</AlertTitle>
            <AlertDescription>{getUsageSummary(verifiedUsage)}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="maybe-base-url">API Base URL</Label>
            <Input
              id="maybe-base-url"
              value={settings.baseUrl}
              onChange={(event) => onChange({ baseUrl: event.target.value })}
              placeholder="https://maybe.example.com/api/v1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maybe-api-key">API Key</Label>
            <Input
              id="maybe-api-key"
              type="password"
              value={settings.apiKey}
              onChange={(event) => onChange({ apiKey: event.target.value })}
              placeholder="X-Api-Key value"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void onSave()} disabled={isSaving}>
            {isSaving ? (
              <Icons.Spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.ShieldCheck className="h-4 w-4" />
            )}
            {isSaved ? "Verified and saved" : "Verify and save"}
          </Button>
          <p className="text-muted-foreground text-sm">
            Base URL should point at the API root that exposes `/accounts` and `/transactions`.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Summarize Maybe's usage response without exposing the API key itself in the UI.
function getUsageSummary(usage: MaybeUsageResponse): string {
  const keyName = usage.api_key?.name ?? "Maybe API key";
  const scopes = usage.api_key?.scopes?.join(", ") ?? "unknown scope";

  return `${keyName} accepted with ${scopes} access.`;
}

// Match the final card dimensions closely so loading secrets does not shift the page.
function SettingsPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-44" />
      </CardContent>
    </Card>
  );
}
