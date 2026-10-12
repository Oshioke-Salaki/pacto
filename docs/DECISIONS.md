# Architecture Decision Records

## ADR-001: Per-buyer settlement instead of all-or-nothing release
Date: 2026-10-12. Status: accepted.
Each buyer's remainder releases on that buyer's confirmation (or timeout or arbitration). This keeps the organizer liquid as items land, isolates disputes to the buyer who raised them, and matches how GOs ship in waves. Cost: more transactions, acceptable on Solana.

## ADR-002: Organizer advance at lock
Date: 2026-10-12. Status: accepted.
Organizers need capital to place the bulk order. The advance is a capped percentage chosen at creation and shown before joining. Buyers accept that exposure explicitly. Reputation and future staking will let proven organizers use higher advances.

## ADR-003: Anchor with `token_interface`
Date: 2026-10-12. Status: accepted.
Supports SPL Token and Token-2022 mints with one code path. USDC is classic SPL today; future stablecoins may be Token-2022.

## ADR-004: No database in MVP
Date: 2026-10-12. Status: accepted.
On-chain state is the source of truth and getProgramAccounts is sufficient for launch volume. The read module is isolated so an indexer can replace it.

## ADR-005: Blinks share transaction builders with the web UI
Date: 2026-10-12. Status: accepted.
One implementation of each instruction's client-side builder, used by both the React components and the Actions route handlers.

## ADR-006: Light theme locked
Date: 2026-10-12. Status: accepted.
Product owner asked for light mode. Tokens are CSS variables so a dark theme can be added later without touching components.

## ADR-007: Name
Date: 2026-10-12. Status: accepted.
"Pacto" (pact in Portuguese and Spanish). Short, bilingual across LatAm, trust-coded. Alternatives considered: Bora (collides with the BORA token), Junto, Fechou (hard outside Brazil).
