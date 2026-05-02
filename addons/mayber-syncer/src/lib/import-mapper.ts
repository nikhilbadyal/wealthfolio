import type { Account, ActivityDetails, ActivityImport } from "@wealthfolio/addon-sdk";
import { DEFAULT_CURRENCY, MAYBE_ID_PATTERN } from "./constants";
import type { ActivityMappingResult, MaybeTransaction } from "../types/maybe";

// Match source and destination accounts by normalized names because Maybe account ids are not Wealthfolio ids.
export function normalizeAccountName(name: string): string {
  return name.trim().toLowerCase();
}

// Build the lookup once per run so mapping transactions is an O(1) account-name lookup.
export function createAccountMap(accounts: Account[]): Map<string, string> {
  return new Map(accounts.map((account) => [normalizeAccountName(account.name), account.id]));
}

// Parse display-formatted Maybe amounts like `-₹3,133.00` into numeric import values.
export function parseMaybeAmount(amount: MaybeTransaction["amount"]): number | null {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : null;
  }

  if (typeof amount !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(amount.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

// Keep classification mapping intentionally small because Maybe categories are not equivalent to trade events.
export function mapClassificationToActivityType(
  classification: string | undefined,
): ActivityImport["activityType"] {
  const normalized = classification?.trim().toLowerCase();

  if (normalized === "income") {
    return "DEPOSIT";
  }

  if (normalized === "transfer") {
    return "TRANSFER_OUT";
  }

  return "WITHDRAWAL";
}

// Read source markers from comments so reruns skip rows that were already imported by this addon.
export function extractImportedMaybeIds(activities: ActivityDetails[]): Set<string> {
  const importedIds = new Set<string>();

  for (const activity of activities) {
    const match = activity.comment?.match(MAYBE_ID_PATTERN);

    if (match?.[1]) {
      importedIds.add(match[1]);
    }
  }

  return importedIds;
}

// Convert Maybe transactions into Wealthfolio import rows and count rows skipped for missing required data.
export function mapTransactionsToActivities(
  transactions: MaybeTransaction[],
  accountMap: Map<string, string>,
  importedMaybeIds: Set<string>,
): ActivityMappingResult<ActivityImport> {
  const activities: ActivityImport[] = [];
  let skippedCount = 0;

  for (const transaction of transactions) {
    const maybeId = transaction.id === undefined ? "" : String(transaction.id);
    const maybeAmount = parseMaybeAmount(transaction.amount_raw ?? transaction.amount);
    const accountName = transaction.account?.name;
    const accountId = accountName ? accountMap.get(normalizeAccountName(accountName)) : undefined;

    if (
      !maybeId ||
      importedMaybeIds.has(maybeId) ||
      !accountId ||
      !transaction.date ||
      maybeAmount === null
    ) {
      skippedCount += 1;
      continue;
    }

    activities.push({
      accountId,
      date: transaction.date,
      activityType: mapClassificationToActivityType(transaction.classification),
      currency: transaction.currency ?? DEFAULT_CURRENCY,
      amount: Math.abs(maybeAmount),
      symbol: "",
      comment: `${transaction.notes ?? ""} [maybe_id:${maybeId}]`.trim(),
      isValid: true,
      isDraft: false,
    });
  }

  return {
    activities,
    skippedCount,
  };
}
