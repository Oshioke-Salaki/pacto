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
| metadata_uri | String (max 200) | JSON with description, images, variants. |
| unit_price | u64 | In mint base units. > 0. |
| min_qty | u32 | >= 1 |
| max_qty | u32 | >= min_qty |
| advance_bps | u16 | <= config.max_advance_bps |
| join_deadline | i64 | Unix seconds. Must be in the future at creation and within 180 days. |
| ship_by_secs | i64 | Window after lock to mark shipped. 1 to 120 days. |
| delivery_window_secs | i64 | Window after shipped for buyers to confirm or dispute. 1 to 90 days. |
| status | enum | Open, Locked, Shipped, Completed, Cancelled |
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

Derived values (not stored): `ship_by = locked_at + ship_by_secs`, `deliver_by = shipped_at + delivery_window_secs`.

### 1.3 `Participation`

Seeds: `["participation", group_order, buyer]`

| Field | Type | Notes |
|---|---|---|
| group_order | Pubkey | |
| buyer | Pubkey | |
| qty | u32 | |
| paid | u64 | qty x unit_price at the time of join. |
| advance_share | u64 | Portion of `paid` that was advanced to the organizer at lock. Set at lock time lazily on first post-lock action (computed as paid x advance_bps / 10000). |
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
      +--------------- Open ---------------+
      | leave (full refund)                 | cancel (organizer, or anyone after deadline if total_qty < min_qty)
      | join                                v
      |                                  Cancelled --- claim_refund (full `paid`) ---> participation closed
      v
   lock (organizer anytime once total_qty >= min_qty, or anyone after deadline if total_qty >= min_qty)
      |  pays organizer: advance = total_paid * advance_bps / 10000, minus fee
      v
    Locked --- (now > ship_by, not shipped) ---> claim_refund (paid - advance_share) per buyer
      |
   mark_shipped (organizer)
      v
    Shipped --- confirm_receipt (buyer) -----------> release remainder minus fee to organizer, close participation
      |     --- open_dispute (buyer, before deliver_by) -> participation.disputed = true
      |     --- resolve_dispute (arbiter): refund remainder to buyer OR release to organizer
      |     --- release_expired (organizer, after deliver_by, not disputed) -> release remainder
      v
    Completed (automatic when settled == participants after lock)
```

Remainder for a buyer is `paid - advance_share`. The advance is the organizer's working capital and is never clawed back by the program; the buyer's exposure is bounded by `advance_bps`, which is shown prominently in the UI.

## 3. Instructions

All instructions verify: account ownership, PDA seeds, `mint` matches `group_order.mint`, token program matches the mint's owner program, vault authority is the GroupOrder PDA.

| # | Name | Signer | Preconditions | Effects |
|---|---|---|---|---|
| 1 | `initialize_config(fee_bps, max_advance_bps, treasury, default_arbiter)` | admin (payer) | Config does not exist. | Creates Config. |
| 2 | `update_config(args)` | config.admin | | Updates any field, including admin handoff. |
| 3 | `create_group_order(args)` | organizer | not paused; validations in 1.2 | Creates GroupOrder and vault ATA. Emits `GroupOrderCreated`. |
| 4 | `join(qty)` | buyer | status Open; now < join_deadline; total_qty + qty <= max_qty; not paused | Transfer qty x unit_price to vault. Create or increase Participation. Emits `Joined`. |
| 5 | `leave()` | buyer | status Open | Refund `paid`. Decrement totals. Close Participation. Emits `Left`. |
| 6 | `lock()` | organizer, or anyone if now >= join_deadline | status Open; total_qty >= min_qty | status = Locked; locked_at = now; advance_paid = total_paid x advance_bps / 10000; transfer advance minus fee to organizer ATA and fee to treasury ATA. Emits `Locked`. |
| 7 | `cancel()` | organizer, or anyone if now >= join_deadline and total_qty < min_qty | status Open | status = Cancelled. Emits `Cancelled`. |
| 8 | `claim_refund()` | buyer | status Cancelled, OR status Locked and now > ship_by | Cancelled: refund `paid`. Locked expired: refund `paid - advance_share`. settled += 1. Close Participation. Emits `Refunded`. |
| 9 | `mark_shipped(shipment_ref)` | organizer | status Locked; now <= ship_by | status = Shipped; shipped_at = now. Emits `Shipped`. |
| 10 | `confirm_receipt()` | buyer | status Shipped; not disputed | Release `paid - advance_share` minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Confirmed`. |
| 11 | `open_dispute()` | buyer | status Shipped; now <= deliver_by; not disputed | disputed = true; disputes_opened += 1. Emits `Disputed`. |
| 12 | `resolve_dispute(refund_buyer)` | group_order.arbiter | status Shipped; participation.disputed | If refund_buyer: refund remainder to buyer and disputes_lost += 1. Else release remainder minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Resolved`. |
| 13 | `release_expired()` | organizer | status Shipped; now > deliver_by; not disputed; not confirmed | Release remainder minus fee to organizer. settled += 1. Close Participation. Auto-complete check. Emits `Released`. |

Auto-complete check: after lock, when `settled == participants`, set `status = Completed` and emit `Completed`. Vault may then be closed by the organizer via `close_vault()` (P1) to recover rent.

Fee rounding: fee = amount x fee_bps / 10000 using integer division (floors in the organizer's favor by at most 1 base unit). Remainders are computed from stored integers so the vault never goes negative. `advance_share` for each buyer is `paid x advance_bps / 10000`, and the sum of per-buyer shares can be less than `advance_paid` by at most `participants` base units; the program accounts for this by paying the organizer's advance from the vault using the same per-buyer formula summed at lock time. See implementation note in `programs/pacto/src/math.rs`.

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
| `TitleTooLong` / `UriTooLong` / `RefTooLong` | String limits. |
| `Unauthorized` | Wrong signer. |
| `AlreadyConfirmed` / `AlreadyDisputed` / `InDispute` | Participation state conflicts. |
| `WindowNotExpired` / `WindowExpired` | Time-gated actions. |
| `MathOverflow` | Checked arithmetic failed. |
| `MintMismatch` | Token account mint differs from GO mint. |

## 6. Client conventions

- `go_id` = `Date.now()` in milliseconds, as u64.
- Amounts displayed as `amount / 10^decimals` using the mint's decimals read on-chain.
- The app never trusts client-supplied state; it reads the GroupOrder account and derives the allowed actions with the same rules as the program (`app/src/lib/pacto/state.ts`).
- Program ID and cluster come from `NEXT_PUBLIC_PACTO_PROGRAM_ID` and `NEXT_PUBLIC_SOLANA_CLUSTER`.
