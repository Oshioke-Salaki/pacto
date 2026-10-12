# Security

## Threat model

Funds at risk: buyer contributions held in per-GO vaults, and the organizer advance once paid. Attackers: a malicious organizer, a malicious buyer, a griefing third party, a compromised arbiter, and a compromised front end.

| Threat | Mitigation |
|---|---|
| Organizer takes all funds | Program only releases the advance at lock and the remainder per buyer on confirmation, timeout or arbitration. Advance is capped by `Config.max_advance_bps` and displayed to buyers before joining. |
| Organizer never ships | After `ship_by`, each buyer reclaims `paid - advance_share`. |
| Buyer never confirms to starve organizer | After `deliver_by`, organizer releases unconfirmed, undisputed remainders. |
| Buyer disputes everything | Disputes stop the auto-release and route to the arbiter; disputes opened and lost are recorded for both sides' reputation. |
| Arbiter collusion | Arbiter is visible on the GO before anyone joins. Arbiter never holds funds; it can only direct the remainder to buyer or organizer. Multi-arbiter and staked arbiters are on the roadmap. |
| Fake GO page phishing | Program ID is pinned in the app, Blinks are served from the canonical domain registered in the Dialect registry, GO addresses are shown and linkable to the explorer. |
| Re-initialization of Participation | `join` uses `init_if_needed` with explicit checks that an existing account has the same buyer and group order. |
| Wrong mint or token program | `token_interface` constraints enforce `mint` and `token_program` match the vault and GO. |
| Integer overflow | All arithmetic uses checked ops; Cargo `overflow-checks = true` in release. |
| Rent griefing | Participation rent is paid by the buyer and refunded on close. |
| Front-end key handling | The app never handles private keys. Wallet Adapter only. No server-side signing. |
| Admin key compromise | Admin can only change fee (capped at 10%), caps, treasury, arbiter default and pause. It cannot touch vaults. Admin will move to a Squads multisig before mainnet. |

## Program checklist (run before every deploy)

- [ ] Every instruction constrains signer, PDA seeds and bump.
- [ ] Every token account used has `mint` and `authority` constraints.
- [ ] Every status transition checks the current status explicitly.
- [ ] Every time-gated action compares against `Clock::get()?.unix_timestamp`.
- [ ] No `unchecked` arithmetic.
- [ ] String lengths validated before writing.
- [ ] `close` targets refund the correct payer.
- [ ] Events emitted for every state change.
- [ ] Tests cover happy path, every refund path, every unauthorized path, and timing edges.

## Web app

- Content Security Policy via `proxy.ts` (script-src self, connect-src restricted to RPC and own origin).
- All RPC reads happen server-side with a private RPC URL; the browser receives only parsed data or uses the public RPC for simulation and sending.
- Blink POST handlers validate `account` is a valid public key and all path params before building a transaction; they never sign.
- No secrets in `NEXT_PUBLIC_*`.

## Disclosure

Report vulnerabilities to the maintainers listed in README. Do not open public issues for security bugs.
