import type { Account, AddonContext } from "@wealthfolio/addon-sdk";
import { DEFAULT_CURRENCY } from "./constants";
import {
  createAccountMap,
  extractImportedMaybeIds,
  mapTransactionsToActivities,
  normalizeAccountName,
} from "./import-mapper";
import { createMaybeApiClient } from "./maybe-api";
import type {
  AccountSyncResult,
  ImportPhase,
  ImportRunSummary,
  MaybeAccount,
  MaybeImporterSettings,
} from "../types/maybe";

// Keep side effects explicit so the hook controls UI state while the service controls import order.
interface RunMaybeImportOptions {
  ctx: AddonContext;
  settings: MaybeImporterSettings;
  onPhaseChange: (phase: ImportPhase) => void;
  onLog: (message: string, level?: "info" | "success" | "warning" | "error") => void;
}

// Create missing Wealthfolio accounts before transaction mapping so imported rows have account ids.
async function syncMaybeAccounts(
  ctx: AddonContext,
  maybeAccounts: MaybeAccount[],
  existingAccounts: Account[],
  onLog: RunMaybeImportOptions["onLog"],
): Promise<AccountSyncResult> {
  const accountMap = createAccountMap(existingAccounts);
  let createdCount = 0;

  for (const maybeAccount of maybeAccounts) {
    if (!maybeAccount.name) {
      continue;
    }

    const accountKey = normalizeAccountName(maybeAccount.name);

    if (accountMap.has(accountKey)) {
      continue;
    }

    onLog(`Creating Wealthfolio account: ${maybeAccount.name}`);

    const createdAccount = await ctx.api.accounts.create({
      // Preserve the source account name because future import runs use this value for matching.
      name: maybeAccount.name,
      // Maybe transaction rows are cash-flow records, so new accounts should support activities.
      accountType: "CASH",
      // Use the source currency when present and fall back to the importer default.
      currency: maybeAccount.currency ?? DEFAULT_CURRENCY,
      // Avoid changing the user's default account during a migration import.
      isDefault: false,
      // Keep imported accounts visible so users can review the generated activities.
      isActive: true,
      // Activity import requires transaction-tracked accounts rather than holdings snapshots.
      trackingMode: "TRANSACTIONS",
    });

    accountMap.set(accountKey, createdAccount.id);
    createdCount += 1;
  }

  return {
    accountMap,
    createdCount,
  };
}

// Run the complete one-way Maybe import pipeline in the same order a user would audit manually.
export async function runMaybeImport({
  ctx,
  settings,
  onPhaseChange,
  onLog,
}: RunMaybeImportOptions): Promise<ImportRunSummary> {
  const maybeApi = createMaybeApiClient(settings, (message) => onLog(message));

  onPhaseChange("accounts");
  onLog("Loading Wealthfolio and Maybe accounts");
  const [wealthfolioAccounts, maybeAccounts] = await Promise.all([
    ctx.api.accounts.getAll(),
    maybeApi.fetchAccounts(),
  ]);
  const accountSync = await syncMaybeAccounts(ctx, maybeAccounts, wealthfolioAccounts, onLog);
  onLog(
    accountSync.createdCount > 0
      ? `Created ${accountSync.createdCount} missing Wealthfolio accounts`
      : "All Maybe accounts already exist in Wealthfolio",
    accountSync.createdCount > 0 ? "success" : "info",
  );

  onPhaseChange("transactions");
  onLog("Loading Maybe transactions");
  const transactions = await maybeApi.fetchTransactions();
  onLog(`Fetched ${transactions.length} Maybe transactions`, "success");

  onPhaseChange("dedupe");
  onLog("Checking existing Wealthfolio activities for previous imports");
  const existingActivities = await ctx.api.activities.getAll();
  const importedMaybeIds = extractImportedMaybeIds(existingActivities);
  onLog(`Found ${importedMaybeIds.size} previously imported Maybe transactions`);

  onPhaseChange("mapping");
  onLog("Mapping Maybe transactions to Wealthfolio activities");
  const mapping = mapTransactionsToActivities(
    transactions,
    accountSync.accountMap,
    importedMaybeIds,
  );
  onLog(`Mapped ${mapping.activities.length} activities and skipped ${mapping.skippedCount} rows`);

  if (mapping.activities.length === 0) {
    onPhaseChange("complete");
    onLog("No new activities to import", "warning");
    return {
      accountsCreated: accountSync.createdCount,
      transactionsFetched: transactions.length,
      transactionsSkipped: mapping.skippedCount,
      activitiesMapped: 0,
      activitiesImported: 0,
    };
  }

  onPhaseChange("validation");
  onLog("Validating mapped activities with Wealthfolio");
  const checkedActivities = await ctx.api.activities.checkImport(mapping.activities);
  const validActivities = checkedActivities.filter((activity) => activity.isValid);
  const invalidCount = checkedActivities.length - validActivities.length;

  if (invalidCount > 0) {
    onLog(`Skipped ${invalidCount} activities that failed Wealthfolio validation`, "warning");
  }

  if (validActivities.length === 0) {
    onPhaseChange("complete");
    onLog("No valid activities to import after validation", "warning");
    return {
      accountsCreated: accountSync.createdCount,
      transactionsFetched: transactions.length,
      transactionsSkipped: mapping.skippedCount + invalidCount,
      activitiesMapped: mapping.activities.length,
      activitiesImported: 0,
    };
  }

  onPhaseChange("import");
  onLog("Importing valid activities into Wealthfolio");
  const result = await ctx.api.activities.import(validActivities);

  onPhaseChange("complete");
  onLog(`Imported ${result.summary.imported} activities`, "success");

  return {
    accountsCreated: accountSync.createdCount,
    transactionsFetched: transactions.length,
    transactionsSkipped: mapping.skippedCount + invalidCount,
    activitiesMapped: mapping.activities.length,
    activitiesImported: result.summary.imported,
  };
}
