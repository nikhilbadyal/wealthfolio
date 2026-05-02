import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icons,
} from "@wealthfolio/ui";
import type { ImportLogEntry } from "../types/maybe";

interface ImportLogPanelProps {
  logs: ImportLogEntry[];
}

const levelVariant: Record<
  ImportLogEntry["level"],
  "secondary" | "success" | "warning" | "destructive"
> = {
  info: "secondary",
  success: "success",
  warning: "warning",
  error: "destructive",
};

// Render logs as structured rows so failed imports are easier to inspect than a plain text blob.
export function ImportLogPanel({ logs }: ImportLogPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.FileText className="text-muted-foreground h-5 w-5" />
          Import log
        </CardTitle>
        <CardDescription>Request and import steps from the latest run.</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="border-border/70 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
            Run an import to see account checks, transaction fetches, validation, and import
            results.
          </div>
        ) : (
          <div className="bg-muted/30 max-h-80 overflow-y-auto rounded-md border p-3">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-background flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center"
                >
                  <span className="text-muted-foreground font-mono text-xs">{log.time}</span>
                  <Badge variant={levelVariant[log.level]}>{log.level}</Badge>
                  <span className="min-w-0 flex-1 break-words">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
