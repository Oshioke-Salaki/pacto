# Handoff: state of the project for the next engineer or agent

Read this first. It says what exists, what works, what is blocked, and what to do next. Update it whenever a task completes.

Last updated: 2026-10-12 (evening, Brasilia). Deadline for Superteam submission: 2026-10-12 23:59 BRT.

## What Pacto is

Escrow for group orders on Solana. See [PRD.md](PRD.md) for product, [PROGRAM.md](PROGRAM.md) for the on-chain spec, [BUSINESS.md](BUSINESS.md) for market and monetization.

## Status board

| Area | State | Notes |
|---|---|---|
| Anchor program (`programs/pacto`) | Done, tested | 14 instructions. 15 tests pass (`cargo test`): 3 math unit tests, 12 LiteSVM lifecycle tests covering every refund path, unauthorized paths, and shared-wallet roles (organizer joins own order, treasury == organizer). Built with `anchor build --arch v0` (required by LiteSVM 0.10; devnet still accepts v0 deploys, SIMD-0500 is inactive there). |
| Program deployed to devnet | Done | `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA`, upgrade authority `HVa4CTKt61EL7mNEQpwb3bFMkvL54KTgy5NsEoJVnSao` (keypair at `~/.config/solana/id.json`; program keypair in `target/deploy/pacto-keypair.json`, gitignored). |
| Devnet bootstrap (test USDC mint, config, arbiter) | Done | Test USDC mint `6cB2ynYGKNmucDwnJRkFhEvamZhe48ewhcEfTKJkG8y6` (authority = deployer). Arbiter `GqrKAFHc8HH7pLZxVzMiVXoNPSJBZZxAXuB9UsRdLj4J` (secret in `keys/arbiter.json`, gitignored). Config: fee 1.5%, max advance 50%, treasury = deployer. |
| Web app (`app/`) | Builds and lints clean | Next.js 16.4, Tailwind v4, Cache Components. Pages: `/`, `/explore`, `/go/[address]`, `/create`, `/dashboard`, `/organizer/[address]`, `/how-it-works`. APIs: `/api/go`, `/api/go/[address]`, `/api/config`, `/api/faucet` (devnet), Blinks at `/api/actions/go/[address]` plus `/actions.json`. |
| End-to-end test (client layer + app APIs) | Passing on local validator and on devnet | `cd app && pnpm e2e` drives create, join, Blink POST join, faucet, API reads, lock, ship, confirm, close vault, leave, cancel, refund through the exact builders the UI uses. Run against devnet after deploy with `SOLANA_RPC_URL=<devnet rpc> USDC_MINT=<mint> SITE_URL=<app url> pnpm e2e`. Local validator needs `--deactivate-feature B8JJXCy5amZyWG9r7EnUYLwzXSXTxG7GZ1qZ1qggo83g` to accept v0 deploys. |
| Vercel deploy | Done | https://pacto-oshiokesalakis-projects.vercel.app (project `pacto`, scope `oshiokesalakis-projects`, linked from `app/`). Env vars set for production and preview. Deployment protection disabled so the site is public. Redeploy with `cd app && vercel --prod --yes`. |
| GitHub | Pushed | https://github.com/Oshioke-Salaki/pacto (branch `main`). |
| Pitch and demo videos | Not done | Script in [PITCH.md](PITCH.md). |
| Submission folder | Not done | Checklist in [SUBMISSION.md](SUBMISSION.md). |

## Exact next steps, in order

The full prioritized to-do list and feature plan lives in [PLAN.md](PLAN.md). Follow it; the short list below is the immediate subset.

1. Open https://pacto-oshiokesalakis-projects.vercel.app with Phantom set to devnet. Dashboard has "Get 100 test USDC". Create an order, join it from a second wallet, walk the lifecycle. Dispute resolution needs the arbiter key from `keys/arbiter.json` imported into a wallet.
2. Record the demo and pitch per [PITCH.md](PITCH.md).
3. Fill the submission folder per [SUBMISSION.md](SUBMISSION.md) and submit on Earn before 23:59 BRT.
4. Optional: register the Blink domain with Dialect so it unfurls on X (https://docs.dialect.to/blinks/blinks-provider/blink-registry). Until then, share via the dial.to preview link on each order page.

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

- Deployer / admin / treasury / faucet authority / mint authority (devnet): `HVa4CTKt61EL7mNEQpwb3bFMkvL54KTgy5NsEoJVnSao`.
- Program id: `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA`.
- Test USDC mint: `6cB2ynYGKNmucDwnJRkFhEvamZhe48ewhcEfTKJkG8y6`. Arbiter: `GqrKAFHc8HH7pLZxVzMiVXoNPSJBZZxAXuB9UsRdLj4J`.
- Live app: https://pacto-oshiokesalakis-projects.vercel.app. Repo: https://github.com/Oshioke-Salaki/pacto.
