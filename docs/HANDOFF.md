# Handoff: state of the project for the next engineer or agent

Read this first. It says what exists, what works, what is blocked, and what to do next. Update it whenever a task completes.

Last updated: 2026-10-12 (evening, Brasilia). Deadline for Superteam submission: 2026-10-12 23:59 BRT.

## What Pacto is

Escrow for group orders on Solana. See [PRD.md](PRD.md) for product, [PROGRAM.md](PROGRAM.md) for the on-chain spec, [BUSINESS.md](BUSINESS.md) for market and monetization.

## Status board

| Area | State | Notes |
|---|---|---|
| Anchor program (`programs/pacto`) | Done, tested | 14 instructions. 15 tests pass (`cargo test`): 3 math unit tests, 12 LiteSVM lifecycle tests covering every refund path, unauthorized paths, and shared-wallet roles (organizer joins own order, treasury == organizer). Built with `anchor build --arch v0` (required by LiteSVM 0.10; devnet still accepts v0 deploys, SIMD-0500 is inactive there). |
| Program deployed to devnet | Blocked | Needs about 3 SOL on `HVa4CTKt61EL7mNEQpwb3bFMkvL54KTgy5NsEoJVnSao` (deployer keypair at `~/.config/solana/id.json`). Public airdrop was rate-limited all session. Program id is fixed: `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA` (keypair in `target/deploy/pacto-keypair.json`, gitignored). |
| Devnet bootstrap (test USDC mint, config, arbiter) | Script ready, not run | `cd app && pnpm setup:devnet` after deploy. Prints env values to paste into `app/.env.local`. |
| Web app (`app/`) | Builds and lints clean | Next.js 16.4, Tailwind v4, Cache Components. Pages: `/`, `/explore`, `/go/[address]`, `/create`, `/dashboard`, `/organizer/[address]`, `/how-it-works`. APIs: `/api/go`, `/api/go/[address]`, `/api/config`, `/api/faucet` (devnet), Blinks at `/api/actions/go/[address]` plus `/actions.json`. |
| End-to-end test (client layer + app APIs) | Passing on a local validator | `cd app && pnpm e2e` drives create, join, Blink POST join, faucet, API reads, lock, ship, confirm, close vault, leave, cancel, refund through the exact builders the UI uses. Run against devnet after deploy with `SOLANA_RPC_URL=<devnet rpc> USDC_MINT=<mint> SITE_URL=<app url> pnpm e2e`. Local validator needs `--deactivate-feature B8JJXCy5amZyWG9r7EnUYLwzXSXTxG7GZ1qZ1qggo83g` to accept v0 deploys. |
| Vercel deploy | Not done | `cd app && vercel`. Set env vars from `app/.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL so Blinks resolve. |
| Pitch and demo videos | Not done | Script in [PITCH.md](PITCH.md). |
| Submission folder | Not done | Checklist in [SUBMISSION.md](SUBMISSION.md). |

## Exact next steps, in order

1. Fund the deployer wallet with devnet SOL (3 SOL is comfortable).
2. Deploy:
   ```bash
   export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
   cd /Users/macbookpro/Desktop/super
   anchor build --arch v0
   anchor deploy --provider.cluster devnet
   ```
   If the program id ever changes, run `anchor keys sync`, rebuild, then `cd app && pnpm sync:idl`.
3. Bootstrap devnet state: `cd app && pnpm setup:devnet`. Paste the printed `NEXT_PUBLIC_USDC_MINT` and `FAUCET_AUTHORITY_SECRET` into `app/.env.local`.
4. Verify: `cd app && SOLANA_RPC_URL=https://api.devnet.solana.com USDC_MINT=<mint> pnpm e2e` (deployer wallet needs about 0.1 SOL for the test buyer airdrop; on devnet the script's `requestAirdrop` may be rate-limited, in which case fund the buyer manually or skip to the UI test).
5. Run locally: `cd app && pnpm dev`. Connect Phantom on devnet, click "Get 100 test USDC" on the dashboard, create an order, join it from a second wallet, walk the lifecycle.
6. Deploy the app to Vercel with the same env vars, then update `NEXT_PUBLIC_SITE_URL`.
7. Test the Blink: open `https://dial.to/?action=solana-action:<SITE_URL>/api/actions/go/<address>` (set wallet to devnet).
8. Record the demo and pitch, fill the submission folder, submit on Earn.

## How to work in this repo

- Program changes: edit `programs/pacto/src`, run `cargo test`, then `anchor build --arch v0`, then `cd app && pnpm sync:idl`, then `pnpm typecheck`. Update [PROGRAM.md](PROGRAM.md) in the same commit.
- App changes: `pnpm typecheck && pnpm lint && pnpm build` before committing. The app uses Cache Components, so any `Date.now()` or uncached data read inside a component must be behind `Suspense` or moved into a helper (`unixNow()` in `src/lib/pacto/format.ts`).
- Design rules live in [DESIGN.md](DESIGN.md). Light theme is locked.
- Never push to git from an agent; the owner pushes. Commit messages carry no AI attribution.
- Do not leave `next dev` or `next start` running after a task.

## Known gaps and decisions still open

- Cover images are URLs supplied by the organizer; there is no upload. The landing sample card uses an Unsplash concert photo (`src/lib/sample.ts`). Replace with owned brand photography before mainnet.
- Footer "Source code" link points at github.com; set it to the real repository URL in `src/components/layout/footer.tsx`.
- `NEXT_PUBLIC_*` values are inlined at build time. Rebuild after changing the mint, RPC or site URL.
- Arbiter for the demo is a generated keypair in `keys/arbiter.json` (gitignored). A dispute-resolution UI exists on the order page for whoever connects that wallet.
- No indexer. `getProgramAccounts` is called server-side with a 15 second cache for the explore list. Fine for hundreds of orders; see ROADMAP for the Helius path.
- `/api/faucet` keeps its rate limit in memory, so it resets on each serverless cold start. Acceptable for devnet.
- Portuguese localization is not started. Strings are all in `src/components` and `src/app`; a strings table is the next step.
- `bigint-buffer` prints a harmless "Failed to load bindings" warning during build because pnpm skips native build scripts.

## People and accounts

- Deployer / admin / treasury / faucet authority (devnet): `HVa4CTKt61EL7mNEQpwb3bFMkvL54KTgy5NsEoJVnSao`.
- Program id: `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA`.
