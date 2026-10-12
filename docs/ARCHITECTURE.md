# Architecture

## Repository layout

```
super/
  Anchor.toml              Anchor workspace (cluster, program id, test script)
  Cargo.toml               Rust workspace
  programs/pacto/          On-chain program (Rust, Anchor)
  tests/                   Program tests (TypeScript, run by `anchor test`)
  app/                     Next.js 16 web app (pnpm)
    src/app/               Routes (App Router, Cache Components enabled)
    src/app/api/actions/   Solana Actions (Blinks) endpoints
    src/components/        UI components (server by default, client leaves marked)
    src/lib/pacto/         Program client: IDL, PDAs, state derivation, tx builders
    src/lib/solana/        Connection, cluster, token helpers
    public/actions.json    Blink routing rules
  docs/                    Product and engineering docs (this folder)
  .agents/skills/          Design skills used for the front end
```

## Runtime diagram

```
Browser (Wallet Adapter) ---- sign & send ----> Solana RPC ----> pacto program
    |                                                ^
    | HTML / RSC                                     | reads (cached 10s)
    v                                                |
Next.js server (RSC, route handlers, Blink API) ----+
    |
    +--> X / Discord / wallets render Blinks from /api/actions/*
```

- Reads: server components call `getGroupOrder(address)` and `listGroupOrders()` in `src/lib/pacto/reads.ts`. Results are cached with `use cache` and `cacheLife` (seconds) and tagged per GO so mutations can call `revalidateTag`.
- Writes: client components build an unsigned transaction with the Anchor client, the wallet signs, the browser sends, then the component calls a server action `refreshGroupOrder(address)` to bust the cache.
- Blinks: GET returns metadata and action links, POST returns a base64 serialized transaction for the `account` supplied. Both live under `src/app/api/actions/go/[address]/route.ts` and share tx builders with the web UI so behavior is identical.

## Data model

Everything is derived from on-chain accounts. There is no database in the MVP. Off-chain metadata (description, images) is a JSON document referenced by `metadata_uri`. For the MVP the create flow writes that JSON through `/api/metadata` to a content-addressed store (Vercel Blob or IPFS) and the URI is stored on-chain.

Indexing path: `program.account.groupOrder.all()` with memcmp filters, server side only. Beyond a few thousand GOs, swap for Helius webhooks into Postgres (see ROADMAP). The read layer is behind one module so the swap does not touch UI.

## Environments

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_CLUSTER` | app | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_PACTO_PROGRAM_ID` | app | Deployed program id |
| `NEXT_PUBLIC_USDC_MINT` | app | Settlement mint for new GOs |
| `SOLANA_RPC_URL` | app (server) | Private RPC for reads |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | app | RPC the browser uses to send |
| `NEXT_PUBLIC_SITE_URL` | app | Canonical origin for Blinks |
| `BLOB_READ_WRITE_TOKEN` | app (server) | Metadata uploads (optional) |

## Key design decisions

See [DECISIONS.md](DECISIONS.md).
