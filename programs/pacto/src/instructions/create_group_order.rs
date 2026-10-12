use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::constants::*;
use crate::errors::PactoError;
use crate::events::GroupOrderCreated;
use crate::instructions::shared::now;
use crate::state::{Config, GoStatus, GroupOrder};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateGroupOrderArgs {
    pub go_id: u64,
    pub title: String,
    pub description: String,
    pub details_uri: String,
    pub image_uri: String,
    pub unit_price: u64,
    pub min_qty: u32,
    pub max_qty: u32,
    pub advance_bps: u16,
    pub join_deadline: i64,
    pub ship_by_secs: i64,
    pub delivery_window_secs: i64,
    /// None uses the protocol default arbiter.
    pub arbiter: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: CreateGroupOrderArgs)]
pub struct CreateGroupOrder<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = organizer,
        space = 8 + GroupOrder::INIT_SPACE,
        seeds = [GROUP_ORDER_SEED, organizer.key().as_ref(), &args.go_id.to_le_bytes()],
        bump,
    )]
    pub group_order: Account<'info, GroupOrder>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = organizer,
        associated_token::mint = mint,
        associated_token::authority = group_order,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_group_order(ctx: Context<CreateGroupOrder>, args: CreateGroupOrderArgs) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(!config.paused, PactoError::Paused);
    require!(args.title.len() <= MAX_TITLE_LEN, PactoError::TitleTooLong);
    require!(args.description.len() <= MAX_DESCRIPTION_LEN, PactoError::DescriptionTooLong);
    require!(args.details_uri.len() <= MAX_URI_LEN, PactoError::UriTooLong);
    require!(args.image_uri.len() <= MAX_URI_LEN, PactoError::UriTooLong);
    require!(args.unit_price > 0, PactoError::InvalidPrice);
    require!(args.min_qty >= 1 && args.max_qty >= args.min_qty, PactoError::InvalidQuantity);
    require!(args.advance_bps <= config.max_advance_bps, PactoError::InvalidAdvance);
    require!(
        config.allowed_mint == Pubkey::default() || ctx.accounts.mint.key() == config.allowed_mint,
        PactoError::MintNotAllowed
    );
    let arbiter = args.arbiter.unwrap_or(config.default_arbiter);
    require_keys_neq!(arbiter, ctx.accounts.organizer.key(), PactoError::ArbiterIsOrganizer);

    let ts = now()?;
    require!(
        args.join_deadline > ts && args.join_deadline <= ts.saturating_add(MAX_JOIN_WINDOW_SECS),
        PactoError::InvalidWindow
    );
    require!(
        args.ship_by_secs >= MIN_SHIP_WINDOW_SECS && args.ship_by_secs <= MAX_SHIP_WINDOW_SECS,
        PactoError::InvalidWindow
    );
    require!(
        args.delivery_window_secs >= MIN_DELIVERY_WINDOW_SECS
            && args.delivery_window_secs <= MAX_DELIVERY_WINDOW_SECS,
        PactoError::InvalidWindow
    );

    let go = &mut ctx.accounts.group_order;
    go.organizer = ctx.accounts.organizer.key();
    go.go_id = args.go_id;
    go.mint = ctx.accounts.mint.key();
    go.vault = ctx.accounts.vault.key();
    go.arbiter = arbiter;
    go.title = args.title;
    go.description = args.description;
    go.details_uri = args.details_uri;
    go.image_uri = args.image_uri;
    go.unit_price = args.unit_price;
    go.min_qty = args.min_qty;
    go.max_qty = args.max_qty;
    go.fee_bps = config.fee_bps;
    go.advance_bps = args.advance_bps;
    go.join_deadline = args.join_deadline;
    go.ship_by_secs = args.ship_by_secs;
    go.delivery_window_secs = args.delivery_window_secs;
    go.status = GoStatus::Open;
    go.total_qty = 0;
    go.total_paid = 0;
    go.participants = 0;
    go.settled = 0;
    go.advance_paid = 0;
    go.disputes_opened = 0;
    go.disputes_lost = 0;
    go.created_at = ts;
    go.locked_at = 0;
    go.shipped_at = 0;
    go.shipment_ref = String::new();
    go.bump = ctx.bumps.group_order;

    emit!(GroupOrderCreated {
        group_order: go.key(),
        organizer: go.organizer,
        mint: go.mint,
        unit_price: go.unit_price,
        min_qty: go.min_qty,
        max_qty: go.max_qty,
        join_deadline: go.join_deadline,
        ts,
    });
    Ok(())
}
