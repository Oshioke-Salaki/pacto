# Pacto On-Chain Program Specification

Program name: `pacto`. Framework: Anchor. Token standard: SPL Token and Token-2022 via `token_interface`. Settlement asset: any SPL mint chosen per group order (USDC by default).

This file is the contract between the program and every client. If the program changes, this file changes in the same commit.

## 1. Accounts

### 1.1 `Config` (singleton)

Seeds: `["config"]`

| Field | Type | Notes |
|---|---|---|
| admin | Pubkey | Can update config and pause. |
| treasury | Pubkey | Wallet that owns the fee token accounts (fees are sent to its ATA for the GO mint). |
| default_arbiter | Pubkey | Used when the organizer does not specify one. |
| allowed_mint | Pubkey | Only this mint may be used for new orders. `Pubkey::default()` disables the allowlist. Protects vault accounting from transfer-fee or confidential mints. |
| fee_bps | u16 | Protocol fee on organizer payouts. Max 1000 (10%). MVP default 150 (1.5%). |
| max_advance_bps | u16 | Cap on organizer advance. MVP default 5000 (50%). |
| paused | bool | When true, `create_group_order` and `join` are rejected. Existing GOs can still settle and refund. |
| bump | u8 | |

### 1.2 `GroupOrder`

Seeds: `["group_order", organizer, go_id.to_le_bytes()]`

| Field | Type | Notes |
|---|---|---|
| organizer | Pubkey | Creator and payout recipient. |
| go_id | u64 | Client-chosen, unique per organizer (client uses a timestamp). |
| mint | Pubkey | Settlement token. |
| vault | Pubkey | Token account owned by this PDA. |
| arbiter | Pubkey | Resolves disputes. |
| title | String (max 64) | Display only. |
| description | String (max 280) | Tweet-sized, on-chain, so the product needs no off-chain storage. |
| details_uri | String (max 200) | Link to the organizer's GO post (X, Instagram, Discord) with full details. |
| image_uri | String (max 200) | Cover image URL. |
| unit_price | u64 | In mint base units. > 0. |
| min_qty | u32 | >= 1 |
| max_qty | u32 | >= min_qty |
| fee_bps | u16 | Snapshot of `Config.fee_bps` at creation; admin changes never affect a running order. |
| advance_bps | u16 | <= config.max_advance_bps |
| join_deadline | i64 | Unix seconds. Must be in the future at creation and within 180 days. |
| ship_by_secs | i64 | Window after lock to mark shipped. 1 to 120 days. |
| delivery_window_secs | i64 | Window after shipped for buyers to confirm or dispute. 1 to 90 days. |
| status | enum | Open, Locked, Shipped, Completed, Cancelled, Expired |
| total_qty | u32 | Sum of participation quantities. |
| total_paid | u64 | Sum of participation paid amounts currently held or advanced. |
| participants | u32 | Number of live Participation accounts. |
| settled | u32 | Participations that reached a terminal state after lock. |
| advance_paid | u64 | Gross advance moved to organizer at lock (before fee). |
| disputes_opened | u32 | Reputation signal. |
| disputes_lost | u32 | Disputes resolved in favor of the buyer. |
| created_at, locked_at, shipped_at | i64 | 0 until set. |
| shipment_ref | String (max 96) | Tracking code or proof URI. |
| bump | u8 | |

Derived values (not stored): `ship_by = locked_at + ship_by_secs`, `deliver_by = shipped_at + delivery_window_secs`, `lock_grace_end = join_deadline + 7 days`, `arbitration_end = deliver_by + 30 days`. Constants live in `programs/pacto/src/constants.rs`.

### 1.3 `Participation`

Seeds: `["participation", group_order, buyer]`

| Field | Type | Notes |
|---|---|---|
| group_order | Pubkey | |
| buyer | Pubkey | |
| qty | u32 | |
| paid | u64 | qty x unit_price at the time of join. |
| confirmed | bool | |
| disputed | bool | |
| joined_at | i64 | |
| bump | u8 | |

Participation accounts are closed (rent returned to the buyer) when they reach a terminal state.

## 2. Status machine

```
                       create
                         |
                         v
      +--------------- Open -----------------------------------------+
      | leave (full refund; only before deadline, or if min not met)  | cancel: organizer anytime; anyone after deadline
      | join                                                          |         if min not met OR organizer silent 7 days
      v                                                               v
   lock (organizer only, once total_qty >= min_qty)                Cancelled --- claim_refund (full `paid`) ---> participation closed
      |  pays organizer: advance = total_paid * advance_bps / 10000, minus fee
      v
    Locked --- (now > ship_by, not shipped) ---> claim_refund (paid - advance_share) per buyer ---> Expired when all settled
      |
   mark_shipped (organizer; allowed while settled == 0, even late)
      v
    Shipped --- confirm_receipt (buyer) -----------> release remainder minus fee to organizer, close participation
      |     --- open_dispute (buyer, before deliver_by) -> participation.disputed = true
      |     --- resolve_dispute (arbiter): refund remainder to buyer OR release to organizer
      |     --- release_expired (anyone, after deliver_by, not disputed) -> release remainder to organizer
      |     --- claim_refund (buyer, disputed and now > arbitration_end) -> refund remainder (absent arbiter fallback)
      v
    Completed (automatic when settled == participants)
```

Remainder for a buyer is `paid - ceil(paid * advance_bps / 10000)`. The advance is the organizer's working capital and is never clawed back by the program; the buyer's exposure is bounded by `advance_bps`, which is shown prominently in the UI.

Edge-case policy (each has a test in `programs/pacto/tests/lifecycle.rs`):
- Lock is organizer-only because it pays the organizer. A permissionless lock would hand an advance to an absent organizer.
- If the organizer never locks within 7 days after the deadline, anyone may cancel so buyers are not stranded.
- Once the deadline passes with the minimum met, buyers cannot leave (`Committed`), so the organizer can safely order.
- A late shipment is accepted while no buyer has reclaimed (`settled == 0`); after the first reclaim the order is winding down (`WindDown`).
- Release on delivery timeout is permissionless so a crank can settle for an organizer who went quiet after shipping.
- An unresolved dispute falls back to the buyer 30 days after the delivery window.
- The organizer cannot be the arbiter of their own order.
- Roles may share a wallet (organizer joins their own order; treasury equals organizer). Token accounts that can coincide are marked `dup` so Anchor's duplicate-mutable-account check does not reject them.

## 3. Instructions

All instructions verify: account ownership, PDA seeds, `mint` matches `group_order.mint`, token program matches the mint's owner program, vault authority is the GroupOrder PDA.

| # | Name | Signer | Preconditions | Effects |
|---|---|---|---|---|
| 1 | `initialize_config(allowed_mint, fee_bps, max_advance_bps, treasury, default_arbiter)` | admin (payer) | Config does not exist. | Creates Config. |
| 2 | `update_config(args)` | config.admin | | Updates any field, including admin handoff. |
| 3 | `create_group_order(args)` | organizer | not paused; mint allowed; arbiter != organizer; validations in 1.2 | Creates GroupOrder and vault ATA. Snapshots fee_bps. Emits `GroupOrderCreated`. |
| 4 | `join(qty)` | buyer | status Open; now < join_deadline; total_qty + qty <= max_qty; not paused | Transfer qty x unit_price to vault. Create or increase Participation. Emits `Joined`. |
| 5 | `leave()` | buyer | status Open; now < join_deadline or total_qty < min_qty | Refund `paid`. Decrement totals. Close Participation. Emits `Left`. |
| 6 | `lock()` | organizer | status Open; total_qty >= min_qty | status = Locked; locked_at = now; advance_paid = total_paid x advance_bps / 10000; transfer advance minus fee to organizer ATA and fee to treasury ATA. Emits `Locked`. |
| 7 | `cancel()` | organizer; or anyone if now >= join_deadline and (total_qty < min_qty or now >= lock_grace_end) | status Open | status = Cancelled. Emits `Cancelled`. |
| 8 | `claim_refund()` | buyer | status Cancelled; OR Locked and now > ship_by; OR Shipped, disputed and now > arbitration_end | Cancelled: refund `paid`. Otherwise refund `paid - advance_share`. settled += 1. Close Participation. Locked becomes Expired and Shipped becomes Completed when all settled. Emits `Refunded`. |
| 9 | `mark_shipped(shipment_ref)` | organizer | status Locked; settled == 0 | status = Shipped; shipped_at = now. Emits `Shipped`. |
| 10 | `confirm_receipt()` | buyer | status Shipped; not disputed | Release `paid - advance_share` minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Confirmed`. |
| 11 | `open_dispute()` | buyer | status Shipped; now <= deliver_by; not disputed | disputed = true; disputes_opened += 1. Emits `Disputed`. |
| 12 | `resolve_dispute(refund_buyer)` | group_order.arbiter | status Shipped; participation.disputed | If refund_buyer: refund remainder to buyer and disputes_lost += 1. Else release remainder minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Resolved`. |
| 13 | `release_expired()` | anyone | status Shipped; now > deliver_by; not disputed | Release remainder minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Released`. |

| 14 | `close_vault()` | organizer | status Completed, Cancelled or Expired; settled >= participants | Sweeps rounding dust to the organizer and closes the vault for rent. |

Auto-complete check: when `settled == participants`, Shipped becomes Completed and Locked becomes Expired, emitting `Completed` with the final status.

Rounding: the advance at lock is `floor(total_paid x advance_bps / 10000)`; each buyer's advance share is `ceil(paid x advance_bps / 10000)`. The sum of ceilings is always >= the floored total, so the sum of remainders never exceeds what the vault holds. At most one base unit per buyer stays as dust, recovered by `close_vault`. Fees are `floor(amount x fee_bps / 10000)`. See `programs/pacto/src/math.rs` (unit tested).

## 4. Events

`GroupOrderCreated`, `Joined`, `Left`, `Locked`, `Cancelled`, `Refunded`, `Shipped`, `Confirmed`, `Disputed`, `Resolved`, `Released`, `Completed`. Each carries `group_order` and, where applicable, `buyer`, `amount`, and the unix timestamp. Indexers (Helius webhooks) subscribe to these.

## 5. Errors

| Code | Meaning |
|---|---|
| `Paused` | Protocol paused. |
| `InvalidStatus` | Action not allowed in current status. |
| `DeadlinePassed` | Join after deadline. |
| `DeadlineNotReached` | Permissionless lock or cancel before deadline. |
| `MinimumNotMet` / `MinimumAlreadyMet` | Lock or cancel conditions. |
| `MaxQuantityExceeded` | Join would exceed max_qty. |
| `InvalidQuantity` | qty == 0 or min/max misconfigured. |
| `InvalidPrice` | unit_price == 0. |
| `InvalidAdvance` | advance_bps > max. |
| `InvalidWindow` | Deadline or windows out of bounds. |
| `TitleTooLong` / `DescriptionTooLong` / `UriTooLong` / `RefTooLong` | String limits. |
| `Unauthorized` | Wrong signer. |
| `AlreadyConfirmed` / `AlreadyDisputed` / `InDispute` | Participation state conflicts. |
| `WindowNotExpired` / `WindowExpired` | Time-gated actions. |
| `MathOverflow` | Checked arithmetic failed. |
| `MintMismatch` | Token account mint differs from GO mint. |
| `MintNotAllowed` | Mint not in config allowlist. |
| `ArbiterIsOrganizer` | Organizer set themselves as arbiter. |
| `Committed` | Leave after deadline with minimum met. |
| `WindDown` | Ship after buyers began reclaiming. |
| `VaultNotEmpty` | close_vault before all settled. |
| `NotDisputed` | Resolve or fallback on an undisputed position. |

## 6. Client conventions

- `go_id` = `Date.now()` in milliseconds, as u64.
- Amounts displayed as `amount / 10^decimals` using the mint's decimals read on-chain.
- The app never trusts client-supplied state; it reads the GroupOrder account and derives the allowed actions with the same rules as the program (`app/src/lib/pacto/state.ts`).
- Program ID and cluster come from `NEXT_PUBLIC_PACTO_PROGRAM_ID` and `NEXT_PUBLIC_SOLANA_CLUSTER`.
- Program id: `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA`. Build with `anchor build --arch v0`.
- Tests: `cargo test` runs 3 math unit tests and 10 LiteSVM lifecycle tests in `programs/pacto/tests/lifecycle.rs`.
