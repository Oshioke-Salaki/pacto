//! Pacto: escrow for group orders on Solana.
//!
//! Buyers pool funds into a per-order vault. The organizer receives a capped
//! advance when the order locks and the remainder per buyer as each buyer
//! confirms receipt (or on timeout or arbitration). See docs/PROGRAM.md.

#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

use instructions::*;

declare_id!("G6aqqtwxaYjhqJhZsix3ZweJg8SJd7N6dwZLxewPokLA");

#[program]
pub mod pacto {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, args: InitializeConfigArgs) -> Result<()> {
        instructions::initialize_config(ctx, args)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
        instructions::update_config(ctx, args)
    }

    pub fn create_group_order(ctx: Context<CreateGroupOrder>, args: CreateGroupOrderArgs) -> Result<()> {
        instructions::create_group_order(ctx, args)
    }

    pub fn join(ctx: Context<Join>, qty: u32) -> Result<()> {
        instructions::join(ctx, qty)
    }

    pub fn leave(ctx: Context<BuyerExit>) -> Result<()> {
        instructions::leave(ctx)
    }

    pub fn lock(ctx: Context<Lock>) -> Result<()> {
        instructions::lock(ctx)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        instructions::cancel(ctx)
    }

    pub fn claim_refund(ctx: Context<BuyerExit>) -> Result<()> {
        instructions::claim_refund(ctx)
    }

    pub fn mark_shipped(ctx: Context<MarkShipped>, shipment_ref: String) -> Result<()> {
        instructions::mark_shipped(ctx, shipment_ref)
    }

    pub fn confirm_receipt(ctx: Context<Settle>) -> Result<()> {
        instructions::confirm_receipt(ctx)
    }

    pub fn open_dispute(ctx: Context<OpenDispute>) -> Result<()> {
        instructions::open_dispute(ctx)
    }

    pub fn resolve_dispute(ctx: Context<Settle>, refund_buyer: bool) -> Result<()> {
        instructions::resolve_dispute(ctx, refund_buyer)
    }

    pub fn release_expired(ctx: Context<Settle>) -> Result<()> {
        instructions::release_expired(ctx)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault(ctx)
    }
}
