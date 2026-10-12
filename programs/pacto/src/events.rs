use anchor_lang::prelude::*;

#[event]
pub struct GroupOrderCreated {
    pub group_order: Pubkey,
    pub organizer: Pubkey,
    pub mint: Pubkey,
    pub unit_price: u64,
    pub min_qty: u32,
    pub max_qty: u32,
    pub join_deadline: i64,
    pub ts: i64,
}

#[event]
pub struct Joined {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub qty: u32,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct Left {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct Locked {
    pub group_order: Pubkey,
    pub total_qty: u32,
    pub total_paid: u64,
    pub advance_paid: u64,
    pub ts: i64,
}

#[event]
pub struct Cancelled {
    pub group_order: Pubkey,
    pub by: Pubkey,
    pub ts: i64,
}

#[event]
pub struct Refunded {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct Shipped {
    pub group_order: Pubkey,
    pub shipment_ref: String,
    pub ts: i64,
}

#[event]
pub struct Confirmed {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub released: u64,
    pub fee: u64,
    pub ts: i64,
}

#[event]
pub struct Disputed {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub ts: i64,
}

#[event]
pub struct Resolved {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub refunded_buyer: bool,
    pub amount: u64,
    pub ts: i64,
}

#[event]
pub struct Released {
    pub group_order: Pubkey,
    pub buyer: Pubkey,
    pub released: u64,
    pub fee: u64,
    pub ts: i64,
}

#[event]
pub struct Completed {
    pub group_order: Pubkey,
    pub status: u8,
    pub ts: i64,
}
