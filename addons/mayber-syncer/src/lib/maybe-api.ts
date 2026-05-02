import type {
  MaybeAccount,
  MaybeAccountsResponse,
  MaybeImporterSettings,
  MaybeTransaction,
  MaybeTransactionsResponse,
  MaybeUsageResponse,
} from "../types/maybe";

// Keep logging injectable so API helpers stay independent from React state.
type LogMessage = (message: string) => void;

// Normalize user-entered base URLs once before constructing Maybe endpoints.
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/$/, "");
}

// Read only a small response preview because upstream error pages can be large or contain HTML.
export async function readErrorPreview(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 240);
  } catch {
    return "Unable to read response body";
  }
}

// Accept both array and object account responses so self-hosted Maybe-compatible APIs are tolerated.
function parseAccountsResponse(response: unknown): MaybeAccount[] {
  if (Array.isArray(response)) {
    return response as MaybeAccount[];
  }

  if (response && typeof response === "object") {
    const maybeResponse = response as MaybeAccountsResponse;
    return Array.isArray(maybeResponse.accounts) ? maybeResponse.accounts : [];
  }

  return [];
}

// Keep transaction parsing conservative because missing `transactions` means there is nothing safe to import.
function parseTransactionsResponse(response: MaybeTransactionsResponse): MaybeTransaction[] {
  return Array.isArray(response.transactions) ? response.transactions : [];
}

// Encapsulate Maybe network access behind a tiny client so import orchestration remains readable.
export function createMaybeApiClient(settings: MaybeImporterSettings, log: LogMessage) {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const apiKey = settings.apiKey.trim();

  // Call Maybe directly now that the self-hosted API is expected to answer browser CORS preflights.
  const fetchMaybe = async (targetUrl: string): Promise<Response> => {
    log(`Fetching ${targetUrl}`);
    try {
      return await fetch(targetUrl, {
        // Send only the API key and JSON preference so the browser preflight stays predictable.
        headers: {
          Accept: "application/json",
          "X-Api-Key": apiKey,
        },
      });
    } catch (error) {
      // Browser CORS failures surface as generic network errors, so include the most likely host-side fix.
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new Error(
        `Unable to reach Maybe API from Wealthfolio. Confirm the Maybe host allows CORS for the Wealthfolio origin and X-Api-Key header. ${message}`,
      );
    }
  };

  // Fetch source accounts before transactions so missing Wealthfolio accounts can be created first.
  const fetchAccounts = async (): Promise<MaybeAccount[]> => {
    const fetchPage = async (page: number): Promise<MaybeAccountsResponse> => {
      const response = await fetchMaybe(`${baseUrl}/accounts?per_page=100&page=${page}`);

      if (!response.ok) {
        const bodyPreview = await readErrorPreview(response);
        throw new Error(
          `Failed to fetch Maybe account page ${page}: ${response.status} ${response.statusText} - ${bodyPreview}`,
        );
      }

      return (await response.json()) as MaybeAccountsResponse;
    };

    log("Fetching account page 1");
    const firstPage = await fetchPage(1);
    const totalPages = firstPage.pagination?.total_pages ?? 1;
    let accounts = parseAccountsResponse(firstPage);

    for (let page = 2; page <= totalPages; page += 1) {
      log(`Fetching account page ${page} of ${totalPages}`);
      const pageData = await fetchPage(page);
      accounts = [...accounts, ...parseAccountsResponse(pageData)];
    }

    return accounts;
  };

  // Verify credentials with Maybe's lightweight usage endpoint before secrets are persisted.
  const fetchUsage = async (): Promise<MaybeUsageResponse> => {
    const response = await fetchMaybe(`${baseUrl}/usage`);

    if (!response.ok) {
      const bodyPreview = await readErrorPreview(response);
      throw new Error(
        `Failed to verify Maybe credentials: ${response.status} ${response.statusText} - ${bodyPreview}`,
      );
    }

    return (await response.json()) as MaybeUsageResponse;
  };

  // Fetch all transaction pages because importing only page one would create false success.
  const fetchTransactions = async (): Promise<MaybeTransaction[]> => {
    const fetchPage = async (page: number): Promise<MaybeTransactionsResponse> => {
      const response = await fetchMaybe(`${baseUrl}/transactions?per_page=100&page=${page}`);

      if (!response.ok) {
        const bodyPreview = await readErrorPreview(response);
        throw new Error(
          `Failed to fetch transaction page ${page}: ${response.status} ${response.statusText} - ${bodyPreview}`,
        );
      }

      return (await response.json()) as MaybeTransactionsResponse;
    };

    log("Fetching transaction page 1");
    const firstPage = await fetchPage(1);
    const totalPages = firstPage.pagination?.total_pages ?? 1;
    let transactions = parseTransactionsResponse(firstPage);

    for (let page = 2; page <= totalPages; page += 1) {
      log(`Fetching transaction page ${page} of ${totalPages}`);
      const pageData = await fetchPage(page);
      transactions = [...transactions, ...parseTransactionsResponse(pageData)];
    }

    return transactions;
  };

  return {
    fetchAccounts,
    fetchTransactions,
    fetchUsage,
  };
}
