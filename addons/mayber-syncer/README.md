# Maybe App Importer

Imports accounts and transactions from a Maybe-compatible API into Wealthfolio.

This addon is intended for migration or occasional catch-up imports. It reads
accounts and paginated transactions from a Maybe API, creates missing
Wealthfolio cash accounts, validates mapped activities with Wealthfolio, and
then imports only transactions that have not already been imported.

## What It Does

- Stores the Maybe API base URL and API key in Wealthfolio addon secrets.
- Calls the Maybe API directly with an `X-Api-Key` header.
- Reads Maybe accounts from `/accounts`.
- Creates missing Wealthfolio accounts by matching account names
  case-insensitively.
- Reads Maybe transactions from `/transactions?per_page=100&page=<page>`.
- Converts Maybe transaction classifications into Wealthfolio activity types.
- Adds the Maybe transaction id to `comment` as `[maybe_id:<id>]`.
- Skips transactions whose Maybe id is already present in an existing
  Wealthfolio activity comment.
- Runs `activities.checkImport()` before `activities.import()` so Wealthfolio
  performs its normal import validation.
- Ignores duplicate start requests while an import is already running.
- Imports only rows that pass Wealthfolio validation.

## Current Scope

This is not a two-way sync. It does not update Maybe, delete Wealthfolio
activities, reconcile edited transactions, or import holdings. Transfers are
currently imported as `TRANSFER_OUT`, so review imported transfer rows after a
run.

Re-running the importer is safe for normal sequential use because previously
imported Maybe transaction ids are detected from the `[maybe_id:<id>]` marker.
If that marker is edited or removed from an activity comment, the row may be
imported again.

## Requirements

- Wealthfolio addon SDK `3.3.0`.
- A Maybe-compatible API that returns:
  - `GET /accounts`
  - `GET /transactions?per_page=100&page=<page>`
- API authentication through an `X-Api-Key` header.
- CORS on the Maybe host allowing the Wealthfolio origin and the `X-Api-Key`
  request header.

## Development

Run the addon build watcher:

```bash
pnpm dev
```

Useful checks:

```bash
pnpm type-check
pnpm build
pnpm bundle
```

## Packaging

Create a distributable zip:

```bash
pnpm bundle
```

The bundle contains `manifest.json`, `README.md`, and the built `dist/` output.

## Permissions

- `accounts.getAll` and `accounts.create` map Maybe accounts to Wealthfolio
  accounts and create missing cash accounts.
- `activities.getAll`, `activities.checkImport`, and `activities.import` keep
  imports idempotent and write validated activities.
- `secrets.get` and `secrets.set` store the API base URL and API key securely.
- `ui.sidebar.addItem` and `ui.router.add` expose the importer page inside
  Wealthfolio.
