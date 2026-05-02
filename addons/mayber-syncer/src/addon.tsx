import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { AddonContext, AddonEnableFunction } from "@wealthfolio/addon-sdk";
import { Icons } from "@wealthfolio/ui";
import React from "react";
import { ADDON_ROUTE } from "./lib/constants";
import MaybeImporterPage from "./pages/maybe-importer-page";

// Keep addon registration thin so importer behavior stays in page/hooks/lib modules.
function MaybeImporterAddon({ ctx }: { ctx: AddonContext }) {
  const sharedQueryClient = ctx.api.query.getClient() as QueryClient;

  return (
    <QueryClientProvider client={sharedQueryClient}>
      <MaybeImporterPage ctx={ctx} />
    </QueryClientProvider>
  );
}

// Register navigation and route handles with Wealthfolio, matching the other addon entrypoints.
const enable: AddonEnableFunction = (context) => {
  context.api.logger.info("Maybe App Importer addon is being enabled");

  // Track sidebar handles so disable cleanup can remove only what this addon added.
  const addedItems: Array<{ remove: () => void }> = [];

  try {
    const sidebarItem = context.sidebar.addItem({
      id: "maybe-syncer",
      label: "Maybe Importer",
      icon: <Icons.CloudSync2 className="h-5 w-5" />,
      route: ADDON_ROUTE,
      order: 90,
    });
    addedItems.push(sidebarItem);

    context.router.add({
      path: ADDON_ROUTE,
      component: React.lazy(() =>
        Promise.resolve({
          default: () => <MaybeImporterAddon ctx={context} />,
        }),
      ),
    });

    context.api.logger.info("Maybe App Importer addon enabled successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    context.api.logger.error(`Failed to initialize Maybe App Importer addon: ${message}`);
    throw error;
  }

  context.onDisable(() => {
    // Remove all sidebar entries created by this addon without touching host navigation.
    for (const item of addedItems) {
      try {
        item.remove();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        context.api.logger.error(`Error removing Maybe App Importer sidebar item: ${message}`);
      }
    }
  });
};

export default enable;
