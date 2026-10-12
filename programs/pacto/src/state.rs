use anchor_lang::prelude::*;

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum GoStatus {
    /// Accepting joins and leaves.
    Open,
    /// Minimum met and advance paid; organizer is placing the bulk order.
    Locked,
    /// Organizer marked the order shipped; buyers confirm or dispute.
    Shipped,
    /// Every participation settled after shipment.
    Completed,
    /// Cancelled while Open; buyers reclaim full payments.
    Cancelled,
    /// Locked but never shipped in time; buyers reclaimed remainders.
    Expired,
}

/// Singleton protocol configuration.
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub default_arbiter: Pubkey,
    /// Only this mint may be used for new group orders. `Pubkey::default()`
    /// disables the allowlist. Prevents transfer-fee or confidential mints
    /// from breaking vault accounting.
    pub allowed_mint: Pubkey,
    pub fee_bps: u16,
    pub max_advance_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

/// One escrowed group order.
#[account]
#[derive(InitSpace)]
pub struct GroupOrder {
    pub organizer: Pubkey,
    pub go_id: u64,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub arbiter: Pubkey,
    #[max_len(MAX_TITLE_LEN)]
    pub title: String,
    #[max_len(MAX_DESCRIPTION_LEN)]
    pub description: String,
    /// Link to the organizer's GO post (X, Instagram, Discord) with full details.
    #[max_len(MAX_URI_LEN)]
    pub details_uri: String,
    /// Cover image for the order.
    #[max_len(MAX_URI_LEN)]
    pub image_uri: String,
    pub unit_price: u64,
    pub min_qty: u32,
    pub max_qty: u32,
    /// Snapshot of the protocol fee at creation so admin changes never
    /// affect a running order.
    pub fee_bps: u16,
    pub advance_bps: u16,
    pub join_deadline: i64,
    pub ship_by_secs: i64,
    pub delivery_window_secs: i64,
    pub status: GoStatus,
    pub total_qty: u32,
    pub total_paid: u64,
    pub participants: u32,
    pub settled: u32,
    pub advance_paid: u64,
    pub disputes_opened: u32,
    pub disputes_lost: u32,
    pub created_at: i64,
    pub locked_at: i64,
    pub shipped_at: i64,
    #[max_len(MAX_SHIPMENT_REF_LEN)]
    pub shipment_ref: String,
    pub bump: u8,
}

impl GroupOrder {
    pub fn ship_by(&self) -> i64 {
        self.locked_at.saturating_add(self.ship_by_secs)
    }

    pub fn deliver_by(&self) -> i64 {
        self.shipped_at.saturating_add(self.delivery_window_secs)
    }

    pub fn lock_grace_end(&self) -> i64 {
        self.join_deadline.saturating_add(crate::constants::LOCK_GRACE_SECS)
    }

    pub fn arbitration_end(&self) -> i64 {
        self.deliver_by().saturating_add(crate::constants::ARBITRATION_WINDOW_SECS)
    }

    pub fn signer_seeds<'a>(&'a self, go_id_bytes: &'a [u8; 8]) -> [&'a [u8]; 4] {
        [
            GROUP_ORDER_SEED,
            self.organizer.as_ref(),
            go_id_bytes,
            std::slice::from_ref(&self.bump),
        ]
    }
}

/// One buyer's position in a group order. Closed when it reaches a
/// terminal state so the buyer recovers rent.
#[account]
#[derive(InitSpace)]
pub struct Participation {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub qty: u32,
    pub paid: u64,
    pub confirmed: bool,
    pub disputed: bool,
    pub joined_at: i64,
    pub bump: u8,
}
