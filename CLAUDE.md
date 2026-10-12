# Pacto

Escrow for group orders on Solana. Monorepo: Anchor program at `programs/pacto`, Next.js 16 app at `app/`, docs at `docs/`.

Start with `docs/HANDOFF.md` for current status and next steps. Keep it updated when you finish a task.

## Commands

```bash
# program
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
cargo test                      # 13 tests, LiteSVM, no validator needed
anchor build --arch v0          # v0 is required for LiteSVM and safest for devnet
anchor deploy --provider.cluster devnet

# app
cd app
pnpm sync:idl                   # after any program change
pnpm typecheck && pnpm lint && pnpm build
pnpm dev                        # never leave running after a task
pnpm setup:devnet               # one-time devnet bootstrap (mint, config, arbiter)
```

## Rules

- Program and `docs/PROGRAM.md` change together. State rules in `app/src/lib/pacto/state.ts` mirror the program; change both.
- Follow `docs/DESIGN.md`. Light theme only. One accent color. Phosphor icons. No em-dashes in UI copy.
- Cache Components is on: no `Date.now()` in component bodies (use `unixNow()`), uncached reads go under `Suspense`.
- Never push to git. No AI attribution in commits.
- Secrets live only in `app/.env.local` and `keys/` (both gitignored).
