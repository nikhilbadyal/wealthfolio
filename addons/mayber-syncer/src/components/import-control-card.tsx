import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icons,
  Progress,
} from "@wealthfolio/ui";
import type { ImportPhase, ImportRunState } from "../types/maybe";

interface ImportControlCardProps {
  runState: ImportRunState;
  canRun: boolean;
  onRun: () => void;
  onReset: () => void;
}

const phaseLabels: Record<ImportPhase, string> = {
  idle: "Ready",
  settings: "Settings",
  accounts: "Accounts",
  transactions: "Transactions",
  dedupe: "Duplicates",
  mapping: "Mapping",
  validation: "Validation",
  import: "Importing",
  complete: "Complete",
  error: "Failed",
};

const phaseProgress: Record<ImportPhase, number> = {
  idle: 0,
  settings: 5,
  accounts: 18,
  transactions: 36,
  dedupe: 54,
  mapping: 68,
  validation: 82,
  import: 94,
  complete: 100,
  error: 100,
};

// Keep run controls in one card so users can see status and take the next action in the same place.
export function ImportControlCard({ runState, canRun, onRun, onReset }: ImportControlCardProps) {
  const isError = runState.phase === "error";
  const isComplete = runState.phase === "complete";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Icons.Import className="text-muted-foreground h-5 w-5" />
              Import new transactions
            </CardTitle>
            <CardDescription>
              One-way Maybe import with duplicate detection and validation before write.
            </CardDescription>
          </div>
          <Badge variant={isError ? "destructive" : isComplete ? "success" : "secondary"}>
            {phaseLabels[runState.phase]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>{phaseLabels[runState.phase]}</span>
            <span>{phaseProgress[runState.phase]}%</span>
          </div>
          <Progress value={phaseProgress[runState.phase]} className="h-2" />
        </div>

        {runState.error && (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            {runState.error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onRun} disabled={!canRun || runState.isRunning}>
            {runState.isRunning ? (
              <Icons.Spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.PlayCircle className="h-4 w-4" />
            )}
            {runState.isRunning ? "Importing" : "Import new"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={runState.isRunning}>
            <Icons.Refresh className="h-4 w-4" />
            Clear run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
