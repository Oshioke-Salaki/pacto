use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::constants::*;
use crate::errors::PactoError;
use crate::events::Joined;
use crate::instructions::shared::now;
use crate::state::{Config, GoStatus, GroupOrder, Participation};

#[derive(Accounts)]
pub struct Join<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = mint @ PactoError::MintMismatch,
        has_one = vault,
    )]
    pub group_order: Account<'info, GroupOrder>,
    /// Seeds bind this account to (group_order, buyer), so a second join by the
    /// same buyer tops up the existing position instead of re-initializing it.
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + Participation::INIT_SPACE,
        seeds = [PARTICIPATION_SEED, group_order.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub participation: Account<'info, Participation>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn join(ctx: Context<Join>, qty: u32) -> Result<()> {
    require!(!ctx.accounts.config.paused, PactoError::Paused);
    require!(qty >= 1, PactoError::InvalidQuantity);

    let ts = now()?;
    let go = &mut ctx.accounts.group_order;
    require!(go.status == GoStatus::Open, PactoError::InvalidStatus);
    require!(ts < go.join_deadline, PactoError::DeadlinePassed);

    let new_total_qty = go.total_qty.checked_add(qty).ok_or(PactoError::MathOverflow)?;
    require!(new_total_qty <= go.max_qty, PactoError::MaxQuantityExceeded);

    let amount = go
        .unit_price
        .checked_mul(qty as u64)
        .ok_or(PactoError::MathOverflow)?;

    // Pull funds into the vault.
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.buyer_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    token_interface::transfer_checked(
        CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    let p = &mut ctx.accounts.participation;
    if p.qty == 0 {
        // Fresh position.
        p.group_order = go.key();
        p.buyer = ctx.accounts.buyer.key();
        p.confirmed = false;
        p.disputed = false;
        p.joined_at = ts;
        p.bump = ctx.bumps.participation;
        go.participants = go.participants.checked_add(1).ok_or(PactoError::MathOverflow)?;
    } else {
        require_keys_eq!(p.buyer, ctx.accounts.buyer.key(), PactoError::Unauthorized);
        require_keys_eq!(p.group_order, go.key(), PactoError::Unauthorized);
    }
    p.qty = p.qty.checked_add(qty).ok_or(PactoError::MathOverflow)?;
    p.paid = p.paid.checked_add(amount).ok_or(PactoError::MathOverflow)?;

    go.total_qty = new_total_qty;
    go.total_paid = go.total_paid.checked_add(amount).ok_or(PactoError::MathOverflow)?;

    emit!(Joined {
        group_order: go.key(),
        buyer: ctx.accounts.buyer.key(),
        qty,
        amount,
        ts,
    });
    Ok(())
}
