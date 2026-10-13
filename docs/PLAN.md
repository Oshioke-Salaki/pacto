# Plan

The working to-do list. Work top to bottom. Tick items off as they land and keep [HANDOFF.md](HANDOFF.md) in sync.

Last updated: 2026-10-13.

## Where we are

The product itself is built: the escrow program, the web app, Blinks, the faucet and the devnet deploy all work and are tested. What is missing is the packaging around it (videos, brand files, bios, submission) and the pieces that make a real person trust and use it (easy payment, notifications, reputation, Portuguese).

Effort: S = under 2 hours, M = half a day, L = 1 to 3 days, XL = a week or more.

---

## Phase 0: Check the deadline and submit

The docs list the Superteam deadline as 2026-10-12 23:59 BRT. Confirm on the Earn listing whether it is still open or was extended before spending time here.

- [ ] Confirm the deadline status on Earn (S)
- [ ] Walk the live site end to end on devnet with two wallets: create, join, lock, ship, confirm, refund (S)
- [ ] Import `keys/arbiter.json` into a wallet and test dispute resolution (S)
- [x] Logo as SVG and PNG in `app/public/brand/` (S)
- [x] Project name, short description, chains and tools text (S). In SUBMISSION.md
- [ ] Team bios, one paragraph each. The team must include at least one woman (S)
- [ ] Record the pitch video, 2 to 3 minutes, per [PITCH.md](PITCH.md) (M)
- [ ] Record the demo video, up to 3 minutes: create, join via web, join via Blink, lock, ship, confirm, refund (M)
- [ ] Assemble the shared submission folder and submit (S)
- [x] Final check, app side: `pnpm typecheck && pnpm lint && pnpm build` all pass (run `pnpm exec next typegen` first on a fresh clone) (S)
- [ ] Final check, program side: `cargo test` needs the Anchor CLI and Solana toolchain to build `pacto.so` first; neither is installed on this machine (S)

## Phase 1: Quick wins that sharpen the demo

Small, visible, low risk.

- [x] Organizer reputation card: completed orders, disputes, volume settled, with a share image for X (M). Image at `/organizer/[address]/opengraph-image`, share buttons on the organizer page
- [ ] Portuguese toggle with a strings table (M). Strings live in `app/src/lib/i18n/messages.ts`; use `<T k="..." />` in server components and `useT()` in client ones
  - [x] Infrastructure, EN/PT toggle in nav, browser-language default, landing page, nav, footer
  - [x] Wallet button, faucet, GO card, status chips, progress bar, explore page (formatters take a locale tag)
  - [x] Order page: action panel, timeline, terms, participants, share rows, organizer card
  - [x] Program error messages (`explainError` uses `tNow`)
  - [ ] Create form, dashboard, how-it-works
- [ ] Cover image upload instead of pasted URLs (Vercel Blob) (M)
- [ ] Empty states and first-run guidance on dashboard and explore (S)
- [ ] Register the Blink domain with Dialect so links unfurl on X (S)
- [ ] Replace the Unsplash sample photo with owned imagery (S)
- [ ] Persist the faucet rate limit (KV or similar) instead of in-memory (S)

## Phase 2: Remove the crypto barrier (the biggest gap)

The target users pay with Pix and do not own USDC or a wallet. Until this is solved, Pacto is a crypto app to them.

- [ ] Sign in with email or passkey via an embedded wallet provider (L)
- [ ] Pix on-ramp: buyer pays in BRL, receives USDC in the embedded wallet (XL). Partner candidates in [BUSINESS.md](BUSINESS.md)
- [ ] Gas sponsorship so buyers never need SOL (M)
- [ ] Show every amount in BRL alongside USDC (S)
- [ ] If the on-ramp cannot ship in time, build a clearly labeled mock of the flow for the demo (M)

## Phase 3: Keep people informed

- [ ] Email notifications for lock, shipped, deliver-by approaching, refund available (M)
- [ ] WhatsApp notifications (L)
- [ ] Helius webhook indexer into Postgres for fast explore, search and event triggers (L). Replaces `getProgramAccounts`

## Phase 4: Make it safer

- [ ] Second-engineer security review; fuzz tests on `math.rs` (L)
- [ ] Admin behind a Squads multisig before mainnet (M)
- [ ] Organizer collateral: first-time organizers lock a small deposit that buyers can claim on non-delivery (L, needs program change and [PROGRAM.md](PROGRAM.md) update)
- [ ] Shipping proof with photos and tracking numbers attached to the shipped step (M)
- [ ] Replace the single placeholder arbiter with a clear arbiter policy (S), then a staked community arbiter set (XL)
- [ ] Mainnet deploy checklist and real USDC mint (M)

## Phase 5: Features that make it more compelling

Ordered by how much they change the story.

1. **Pix to locked box, no crypto visible.** Phase 2 above. The single biggest lever.
2. **Reputation that travels.** Public organizer score and badges, readable from chain, shareable as a card. New organizers want it, and buyers use it to decide.
3. **Organizer collateral.** Makes a first-time organizer safe to trust.
4. **Variants and tiers in one order.** Sizes, colors, different prices. Real group orders always need this (L, program change).
5. **Private address collection.** Buyers submit shipping addresses encrypted to the organizer, so no spreadsheet juggling (L).
6. **Community arbiters who stake.** Bad rulings cost the arbiter, good ones earn a fee (XL).
7. **Order chat or updates feed** tied to the order page, so questions stop leaking into DMs (M).
8. **Yield on idle vault balances**, opt-in, conservative venues only (L).
9. **Escrow API and Discord bot** for third-party communities and marketplaces (XL).
10. **Beyond fandom:** class trips, party supplies, secondhand sales, freelance deals on the same program (XL).
11. **Spanish localization** for Mexico, Argentina, Chile (M).
12. **Mobile app** via Solana Mobile (XL).

## Rules while working

- Program change: edit `programs/pacto/src`, `cargo test`, `anchor build --arch v0`, `cd app && pnpm sync:idl`, `pnpm typecheck`. Update [PROGRAM.md](PROGRAM.md) in the same commit. Mirror rules in `app/src/lib/pacto/state.ts`.
- App change: `pnpm typecheck && pnpm lint && pnpm build` before committing.
- Follow [DESIGN.md](DESIGN.md): light theme, one accent, Phosphor icons, no em-dashes in UI copy.
- Never push. No AI attribution in commits.
