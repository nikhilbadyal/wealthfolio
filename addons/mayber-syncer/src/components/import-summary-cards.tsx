import { Card, CardContent, CardDescription, CardHeader, CardTitle, Icons } from "@wealthfolio/ui";
import type { ImportRunSummary } from "../types/maybe";

interface ImportSummaryCardsProps {
  summary: ImportRunSummary | null;
}

const emptySummary: ImportRunSummary = {
  accountsCreated: 0,
  transactionsFetched: 0,
  transactionsSkipped: 0,
  activitiesMapped: 0,
  activitiesImported: 0,
};

// Show stable KPI cards even before a run so the page layout does not jump after import.
export function ImportSummaryCards({ summary }: ImportSummaryCardsProps) {
  const visibleSummary = summary ?? emptySummary;

  const cards = [
    {
      label: "Accounts created",
      value: visibleSummary.accountsCreated,
      description: "Missing Maybe accounts added as cash accounts",
      icon: Icons.Wallet,
    },
    {
      label: "Transactions fetched",
      value: visibleSummary.transactionsFetched,
      description: "Rows read from the Maybe API",
      icon: Icons.Database,
    },
    {
      label: "Activities imported",
      value: visibleSummary.activitiesImported,
      description: "Validated rows written to Wealthfolio",
      icon: Icons.CheckCircle,
    },
    {
      label: "Rows skipped",
      value: visibleSummary.transactionsSkipped,
      description: "Duplicates or rows missing required data",
      icon: Icons.AlertCircle,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <Icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value.toLocaleString()}</div>
              <CardDescription className="mt-1">{card.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
