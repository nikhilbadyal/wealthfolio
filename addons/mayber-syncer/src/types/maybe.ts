// Store importer credentials together because the UI saves and validates them as one unit.
export interface MaybeImporterSettings {
  baseUrl: string;
  apiKey: string;
}

// Model only the Maybe account fields needed to create Wealthfolio cash accounts.
export interface MaybeAccount {
  id?: string | number;
  name?: string;
  currency?: string;
}

// Accept wrapped account responses because Maybe-compatible deployments may not return a raw array.
export interface MaybeAccountsResponse {
  accounts?: MaybeAccount[];
  pagination?: {
    total_pages?: number;
  };
}

// Keep the nested account model narrow because transaction matching only needs the account name.
export interface MaybeTransactionAccount {
  name?: string;
}

// Model only the cash-flow fields needed for Wealthfolio activity import rows.
export interface MaybeTransaction {
  id?: string | number;
  date?: string;
  amount?: string | number;
  amount_raw?: string | number;
  currency?: string;
  name?: string;
  notes?: string;
  classification?: string;
  account?: MaybeTransactionAccount;
}

// Preserve pagination metadata so the importer can fetch every Maybe transaction page.
export interface MaybeTransactionsResponse {
  transactions?: MaybeTransaction[];
  pagination?: {
    total_pages?: number;
  };
}

// Model the `/usage` response fields that prove the entered API key is accepted by Maybe.
export interface MaybeUsageResponse {
  api_key?: {
    name?: string;
    scopes?: string[];
    last_used_at?: string;
    created_at?: string;
  };
  rate_limit?: {
    tier?: string;
    limit?: number | null;
    current_count?: number;
    remaining?: number | null;
    reset_in_seconds?: number;
    reset_at?: string;
  };
}

// Keep run phases explicit so UI copy can be stable and not parse log messages.
export type ImportPhase =
  | "idle"
  | "settings"
  | "accounts"
  | "transactions"
  | "dedupe"
  | "mapping"
  | "validation"
  | "import"
  | "complete"
  | "error";

// Store logs as structured entries so the UI can style status without string inspection.
export interface ImportLogEntry {
  id: string;
  time: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

// Summarize the run in numbers that matter to a user reviewing an import.
export interface ImportRunSummary {
  accountsCreated: number;
  transactionsFetched: number;
  transactionsSkipped: number;
  activitiesMapped: number;
  activitiesImported: number;
}

// Keep page run state in one object so reset/complete transitions are easy to reason about.
export interface ImportRunState {
  phase: ImportPhase;
  isRunning: boolean;
  logs: ImportLogEntry[];
  summary: ImportRunSummary | null;
  error: string | null;
}

// Report account synchronization results separately because account creation happens before transaction import.
export interface AccountSyncResult {
  accountMap: Map<string, string>;
  createdCount: number;
}

// Track mapping output and skipped count together for the summary cards.
export interface ActivityMappingResult<TActivity> {
  activities: TActivity[];
  skippedCount: number;
}
