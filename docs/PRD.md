# Pacto - Product Requirements Document

Status: Living document. Owner: product. Last updated: 2026-10-12 (v0.1, hackathon MVP scope).

## 1. One-liner

Pacto is escrow for group orders. Fans and friends pool money to buy things together, the organizer only gets paid as the goods arrive, and every step is enforced by a Solana program instead of trust in a stranger.

Tagline (EN): Group buys, without the trust fall.
Tagline (PT-BR): Compra em grupo. Dinheiro travado ate chegar.

## 2. Problem

"Group orders" (GOs) are how fandom communities buy merch together: one person (the Group Order Manager, "GOM") collects money from dozens of strangers via Pix or bank transfer, places a bulk order abroad to save on shipping and customs, then re-ships each item. The same pattern exists for sneaker drops, Shein and AliExpress hauls, fan-made merch pre-sales, class trips and party supplies.

Today the whole thing runs on screenshots of Pix receipts and the organizer's reputation on X or Instagram. Failure modes:

1. The organizer disappears with the money ("golpe de GO"). Victims have no recourse because Pix is instant and irreversible.
2. The organizer is honest but the order never reaches the minimum, and refunding 60 people manually takes weeks.
3. Items arrive late or damaged and there is no neutral way to decide who eats the loss.
4. Honest organizers cannot prove their track record; every new GO starts from zero trust.

The people with this problem are 16 to 28 years old, live in Brazil, Mexico, Argentina and Chile, already pay for everything with Pix or instant transfers, and are deeply online. They do not want a wallet lesson. They want to not get scammed.

Research notes with sources live in [BUSINESS.md](BUSINESS.md).

## 3. Users

| Persona | Who | What they need |
|---|---|---|
| Buyer (fan) | Joins GOs run by someone they follow. Pays small amounts (R$40 to R$400). | Pay in two taps, see exactly when money moves, get a refund without begging. |
| Organizer (GOM) | Runs 2 to 20 GOs per year, handles customs and re-shipping. Often a student. | Collect without chasing receipts, prove they deliver, get paid promptly as items ship. |
| Arbiter | A trusted community member or Pacto staff who resolves disputes. | Clear evidence trail, a single decision button, no custody of funds. |

## 4. Solution

A Solana program holds every contribution in a vault per group order. Money moves only on state transitions that are enforced on-chain:

```
Open -> Locked -> Shipped -> Completed
  |        |
  v        v
Cancelled  (buyers refund the undelivered share if organizer never ships)
```

- Buyers join with USDC. They can leave with a full refund while the GO is Open.
- When the deadline passes and the minimum is met, the organizer locks the GO and receives an advance (default 50%, capped by protocol config) to place the bulk order.
- The organizer marks the order shipped with proof. Each buyer confirms receipt, which releases that buyer's remaining share to the organizer.
- If a buyer does not confirm within the delivery window, the remainder auto-releases (protects organizers from ghosting). If a buyer disputes, an arbiter decides.
- If the organizer never ships by the ship-by date, every buyer reclaims their remainder.
- Every completed GO is a permanent on-chain record, which becomes the organizer's portable reputation.

Every GO is also a Blink (Solana Action), so "join this GO" is a link that renders as a pay button inside X, Discord and any Blink-aware wallet.

## 5. Why Solana

- Sub-cent fees make R$40 contributions and per-buyer settlement viable. Doing per-buyer release on Ethereum would cost more than the item.
- Finality in seconds matches Pix expectations. Buyers are used to instant.
- Blinks turn a GO into a shareable transaction link, which is how fandom already coordinates (X threads, Discord).
- USDC on Solana is the most liquid dollar rail in LatAm crypto, with Pix on-ramps already live.
- Program state is the source of truth, so organizer reputation is portable to any client, not locked in Pacto's database.

## 6. Scope

### 6.1 MVP (this submission)

On-chain (Anchor program `pacto`):
- Protocol config with fee and caps (admin-only).
- Create group order, join, leave, lock with advance, cancel, claim refund, mark shipped, confirm receipt, release expired, open dispute, resolve dispute, complete.
- Protocol fee taken from organizer payouts, routed to a treasury token account.
- Events for every transition.

Web app (Next.js):
- Landing page that explains the vision in one scroll.
- Explore: list open GOs.
- GO detail page: progress, timeline, join or leave, organizer card with on-chain track record.
- Create GO flow for organizers.
- Dashboard: my GOs as organizer and as buyer, with the next action surfaced.
- Blink endpoints (`/api/actions/...`) plus `actions.json`.
- Wallet connection via Solana Wallet Adapter (Phantom, Solflare, Backpack). Devnet USDC.

### 6.2 Explicitly out of MVP

- Pix on-ramp (documented integration path in ROADMAP).
- Embedded wallets and social login.
- Off-chain metadata hosting beyond a simple JSON on IPFS or a URL field.
- Mobile apps.
- Yield on idle vault balances.

## 7. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Organizer can create a GO with title, description URI, unit price, min and max quantity, join deadline, advance percentage, ship-by window, delivery window, arbiter. | P0 |
| F2 | Buyer can join an Open GO for N units and pay N x unit price in USDC into the vault. | P0 |
| F3 | Buyer can leave an Open GO and receive a full refund. | P0 |
| F4 | After the deadline, anyone can lock (if minimum met) or cancel (if not). Organizer can lock early once minimum is met, and can cancel while Open. | P0 |
| F5 | Locking pays the organizer the advance share minus protocol fee. | P0 |
| F6 | Organizer can mark shipped with a proof reference. | P0 |
| F7 | Buyer can confirm receipt, releasing their remainder minus fee to the organizer. | P0 |
| F8 | After the delivery window, organizer can release unconfirmed, undisputed remainders. | P0 |
| F9 | Buyer can dispute between shipped and delivery deadline. Arbiter resolves by refunding or releasing. | P0 |
| F10 | If ship-by passes without shipment, each buyer can reclaim their remainder. | P0 |
| F11 | When every participation is settled, the GO becomes Completed. | P0 |
| F12 | Every GO exposes a Blink for joining. | P0 |
| F13 | Organizer profile shows completed GOs, disputes lost, volume settled. | P1 |
| F14 | Admin can pause new GO creation. | P1 |
| F15 | Multi-tier GOs (variants with different prices). | P2 |

## 8. Non-functional requirements

- Security: program follows the checklist in [SECURITY.md](SECURITY.md). All arithmetic checked. All state transitions guarded by status and time.
- Performance: landing LCP under 2.5s on 4G. Chain reads cached server-side for 10s and revalidated on action. No getProgramAccounts from the browser.
- Accessibility: WCAG AA contrast, keyboard navigable, reduced-motion respected.
- Localization: English first, Portuguese strings table scaffolded (P1).
- Observability: every transaction surfaced with an explorer link; failures show the program error name in plain language.

## 9. Success metrics (post hackathon)

- Activation: percentage of created GOs that reach Locked.
- Trust: dispute rate and refund rate per 100 GOs.
- Retention: organizers who create a second GO within 60 days.
- Volume: USDC settled per month and protocol fee revenue.

## 10. Open questions

- Who arbitrates at scale: a staffed queue, community arbiters with stake, or a mix. MVP uses a per-GO arbiter pubkey chosen at creation (defaults to the Pacto arbiter key).
- Pix on-ramp partner selection (see ROADMAP).
- Whether to allow organizers to set advance to 0 (buyer-safest) and whether a higher advance should require reputation.
