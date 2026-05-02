import type { AddonContext } from "@wealthfolio/addon-sdk";
import { useRef, useState } from "react";
import { createImportLog } from "../lib/import-log";
import { runMaybeImport } from "../lib/importer-service";
import type {
  ImportLogEntry,
  ImportPhase,
  ImportRunState,
  MaybeImporterSettings,
} from "../types/maybe";

// Keep the initial state as a constant factory so clear/reset cannot accidentally reuse mutable arrays.
function createInitialRunState(): ImportRunState {
  return {
    phase: "idle",
    isRunning: false,
    logs: [],
    summary: null,
    error: null,
  };
}

// Manage run lifecycle state while delegating import side effects to the service layer.
export function useMaybeImporter(ctx: AddonContext) {
  const [runState, setRunState] = useState<ImportRunState>(createInitialRunState);
  const isImportingRef = useRef(false);

  // Append structured log entries so UI rendering does not depend on string parsing.
  const appendLog = (message: string, level: ImportLogEntry["level"] = "info") => {
    setRunState((currentState) => ({
      ...currentState,
      logs: [...currentState.logs, createImportLog(message, level)],
    }));
  };

  // Update phase through one path so progress display and button states stay synchronized.
  const setPhase = (phase: ImportPhase) => {
    setRunState((currentState) => ({
      ...currentState,
      phase,
    }));
  };

  // Start one import run and let the service return a concise summary for the dashboard cards.
  const startImport = async (settings: MaybeImporterSettings) => {
    if (isImportingRef.current) {
      appendLog("Import already running; ignored duplicate start request", "warning");
      return;
    }

    // Guard against double-clicks and multiple event dispatches before React disables the button.
    isImportingRef.current = true;

    setRunState({
      ...createInitialRunState(),
      phase: "accounts",
      isRunning: true,
      logs: [createImportLog("Starting Maybe import")],
    });

    try {
      const summary = await runMaybeImport({
        ctx,
        settings,
        onPhaseChange: setPhase,
        onLog: appendLog,
      });

      setRunState((currentState) => ({
        ...currentState,
        phase: "complete",
        isRunning: false,
        summary,
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendLog(`Import failed: ${message}`, "error");
      ctx.api.logger.error(`Maybe import failed: ${message}`);

      setRunState((currentState) => ({
        ...currentState,
        phase: "error",
        isRunning: false,
        error: message,
      }));
    } finally {
      isImportingRef.current = false;
    }
  };

  // Clear logs and summary without touching saved settings.
  const resetRun = () => {
    if (isImportingRef.current) {
      return;
    }

    setRunState(createInitialRunState());
  };

  return {
    runState,
    startImport,
    resetRun,
  };
}
