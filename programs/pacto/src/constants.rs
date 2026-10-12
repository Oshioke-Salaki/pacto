//! Protocol-wide constants. Changing a limit here is a program upgrade and
//! must be reflected in docs/PROGRAM.md.

pub const CONFIG_SEED: &[u8] = b"config";
pub const GROUP_ORDER_SEED: &[u8] = b"group_order";
pub const PARTICIPATION_SEED: &[u8] = b"participation";

pub const MAX_TITLE_LEN: usize = 64;
/// Tweet-sized description kept on-chain so the product needs no off-chain storage.
pub const MAX_DESCRIPTION_LEN: usize = 280;
pub const MAX_URI_LEN: usize = 200;
pub const MAX_SHIPMENT_REF_LEN: usize = 96;

pub const BPS_DENOMINATOR: u64 = 10_000;
/// Hard ceiling on the protocol fee the admin may configure (10%).
pub const MAX_FEE_BPS: u16 = 1_000;
/// Hard ceiling on the organizer advance the admin may allow (80%).
pub const MAX_ALLOWED_ADVANCE_BPS: u16 = 8_000;

pub const SECONDS_PER_DAY: i64 = 86_400;
/// Join deadline must be within this many days of creation.
pub const MAX_JOIN_WINDOW_SECS: i64 = 180 * SECONDS_PER_DAY;
pub const MIN_SHIP_WINDOW_SECS: i64 = SECONDS_PER_DAY;
pub const MAX_SHIP_WINDOW_SECS: i64 = 120 * SECONDS_PER_DAY;
pub const MIN_DELIVERY_WINDOW_SECS: i64 = SECONDS_PER_DAY;
pub const MAX_DELIVERY_WINDOW_SECS: i64 = 90 * SECONDS_PER_DAY;
/// After the join deadline, the organizer has this long to lock before anyone
/// may cancel for full refunds (protects buyers from a silent organizer).
pub const LOCK_GRACE_SECS: i64 = 7 * SECONDS_PER_DAY;
/// After deliver_by, an unresolved dispute may be reclaimed by the buyer once
/// this window passes (protects buyers from an absent arbiter).
pub const ARBITRATION_WINDOW_SECS: i64 = 30 * SECONDS_PER_DAY;
