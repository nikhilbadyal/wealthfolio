import type { AddonContext } from "@wealthfolio/addon-sdk";
import { Page, PageContent, PageHeader } from "@wealthfolio/ui";
import {
  ImportControlCard,
  ImportLogPanel,
  ImportSummaryCards,
  SettingsPanel,
} from "../components";
import { useMaybeImporter, useMaybeImporterSettings } from "../hooks";

interface MaybeImporterPageProps {
  ctx: AddonContext;
}

// Compose the importer screen from focused panels so UI, state, and import logic stay separated.
export default function MaybeImporterPage({ ctx }: MaybeImporterPageProps) {
  const settingsState = useMaybeImporterSettings(ctx);
  const { runState, startImport, resetRun } = useMaybeImporter(ctx);

  const trimmedSettings = {
    baseUrl: settingsState.settings.baseUrl.trim(),
    apiKey: settingsState.settings.apiKey.trim(),
  };

  const canRun =
    !settingsState.isLoading &&
    !runState.isRunning &&
    trimmedSettings.baseUrl.length > 0 &&
    trimmedSettings.apiKey.length > 0;

  // Run imports from the current form values so users can test before explicitly saving.
  const handleRunImport = () => {
    void startImport(trimmedSettings);
  };

  return (
    <Page>
      <PageHeader
        heading="Maybe App Importer"
        text="Import new Maybe accounts and transactions into Wealthfolio"
      />

      <PageContent>
        <div className="space-y-6">
          <SettingsPanel
            settings={settingsState.settings}
            isLoading={settingsState.isLoading}
            isSaving={settingsState.isSaving}
            isSaved={settingsState.isSaved}
            error={settingsState.error}
            verifiedUsage={settingsState.verifiedUsage}
            onChange={settingsState.updateSettings}
            onSave={settingsState.saveSettings}
          />

          <ImportControlCard
            runState={runState}
            canRun={canRun}
            onRun={handleRunImport}
            onReset={resetRun}
          />

          <ImportSummaryCards summary={runState.summary} />

          <ImportLogPanel logs={runState.logs} />
        </div>
      </PageContent>
    </Page>
  );
}
