# Pacto

Escrow for group orders on Solana. Fans and friends pool money to buy together; the organizer gets paid only as the goods arrive; every rule is enforced by a program, not by trust in a stranger.

- Product and market: [docs/PRD.md](docs/PRD.md), [docs/BUSINESS.md](docs/BUSINESS.md)
- On-chain spec: [docs/PROGRAM.md](docs/PROGRAM.md)
- Current status and next steps: [docs/HANDOFF.md](docs/HANDOFF.md)
- Architecture, security, design, roadmap, decisions: [docs/](docs/)

## Stack

| Layer | Tech |
|---|---|
| Program | Rust, Anchor 1.2.1, SPL Token via `token_interface`, LiteSVM tests |
| App | Next.js 16 (App Router, Cache Components), React 19, Tailwind v4, Motion, TanStack Query |
| Solana client | `@anchor-lang/core` 1.2.1, `@solana/web3.js` 1.99, Wallet Adapter (Wallet Standard) |
| Blinks | Solana Actions spec 2.4 via `@solana/actions` |
| Settlement | USDC (devnet: Pacto test USDC mint, mainnet: Circle USDC) |

## Quick start

```bash
# toolchain
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# program
cargo test
anchor build --arch v0
anchor deploy --provider.cluster devnet

# app
cd app
cp .env.example .env.local      # fill in values printed by setup:devnet
pnpm install
pnpm setup:devnet               # creates test USDC mint, arbiter key, protocol config
pnpm dev
```

Live app (devnet): https://pacto-oshiokesalakis-projects.vercel.app

Program id (devnet): `G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA`

## How it works

1. Organizer creates an order with price, minimum, maximum, deadline, advance percentage, ship-by and delivery windows.
2. Buyers join by paying USDC into the order's vault. They can leave for a full refund until the deadline.
3. When the minimum is met the organizer locks the order and receives the capped advance to place the bulk order.
4. The organizer marks the order shipped. Each buyer confirms receipt, which releases their remaining share. Disputes go to a neutral arbiter.
5. If the organizer never ships, buyers reclaim their held share. If the minimum fails, everyone is refunded in full.

Every order is also a Blink: paste the link into X or Discord and it renders as a join button.

## Repository layout

```
programs/pacto/   Anchor program and LiteSVM tests
app/              Next.js app (pages, Blink API, program client)
docs/             Product, engineering and handoff documentation
```

## License

MIT
