import type { ImportLogEntry } from "../types/maybe";

// Generate compact ids without a dependency because logs only need stable React keys within one run.
function createLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Create logs in one helper so timestamp and level formatting stay consistent across the importer.
export function createImportLog(
  message: string,
  level: ImportLogEntry["level"] = "info",
): ImportLogEntry {
  return {
    id: createLogId(),
    time: new Date().toLocaleTimeString(),
    level,
    message,
  };
}
