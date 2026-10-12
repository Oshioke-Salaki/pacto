# Roadmap

## Now (hackathon MVP, devnet)
- Program with full escrow lifecycle. Tests.
- Web app: landing, explore, GO page, create, dashboard, Blinks.
- Submission package (see SUBMISSION.md).

## Next 30 days
- Security review of the program by a second engineer; fuzz tests on the math module.
- Mainnet deploy with admin behind a Squads multisig.
- Pix on-ramp: embed a partner widget so buyers pay in BRL and receive USDC into an embedded wallet. Candidates are documented in BUSINESS.md.
- Embedded wallets with passkeys or social login so buyers never see a seed phrase.
- Portuguese and Spanish localization.
- Organizer profile pages with shareable reputation card.

## 60 to 90 days
- Helius webhook indexer into Postgres for fast explore, search and notifications.
- Email and WhatsApp notifications for state changes (lock, shipped, deliver_by approaching).
- Variants and tiers inside one GO.
- Arbiter marketplace: community arbiters who stake and earn a fee per resolution.
- Yield on idle vault balances (opt-in per GO, conservative venues only).

## Later
- Escrow API for third-party marketplaces and Discord bots.
- Generic peer-to-peer deals (secondhand, freelance) using the same program.
- Mobile app (Solana Mobile).
