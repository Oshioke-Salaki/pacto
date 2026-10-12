//! Organizer-side transitions: lock, cancel, mark shipped, close vault.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface};

use crate::constants::*;
use crate::errors::PactoError;
use crate::events::{Cancelled, Locked, Shipped};
use crate::instructions::shared::{now, vault_transfer};
use crate::math::{mul_bps_floor, split_fee};
use crate::state::{Config, GoStatus, GroupOrder};

/// Only the organizer may lock, because locking pays them the advance. If the
/// organizer goes silent after the deadline, anyone may `cancel` once the
/// lock grace period passes.
#[derive(Accounts)]
pub struct Lock<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = mint @ PactoError::MintMismatch,
        has_one = vault,
        has_one = organizer @ PactoError::Unauthorized,
    )]
    pub group_order: Account<'info, GroupOrder>,
    /// CHECK: constrained to config.treasury.
    #[account(address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = organizer,
        associated_token::mint = mint,
        associated_token::authority = organizer,
        associated_token::token_program = token_program,
    )]
    pub organizer_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = organizer,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn lock(ctx: Context<Lock>) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    require!(go.status == GoStatus::Open, PactoError::InvalidStatus);
    require!(go.total_qty >= go.min_qty, PactoError::MinimumNotMet);

    let advance_gross = mul_bps_floor(go.total_paid, go.advance_bps)?;
    let (net, fee) = split_fee(advance_gross, go.fee_bps)?;

    vault_transfer(
        go,
        &ctx.accounts.vault,
        &ctx.accounts.organizer_token_account,
        &ctx.accounts.mint,
        &ctx.accounts.token_program,
        net,
    )?;
    vault_transfer(
        go,
        &ctx.accounts.vault,
        &ctx.accounts.treasury_token_account,
        &ctx.accounts.mint,
        &ctx.accounts.token_program,
        fee,
    )?;

    let go = &mut ctx.accounts.group_order;
    go.status = GoStatus::Locked;
    go.locked_at = ts;
    go.advance_paid = advance_gross;

    emit!(Locked {
        group_order: go.key(),
        total_qty: go.total_qty,
        total_paid: go.total_paid,
        advance_paid: advance_gross,
        ts,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
    )]
    pub group_order: Account<'info, GroupOrder>,
}

pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
    let ts = now()?;
    let go = &mut ctx.accounts.group_order;
    require!(go.status == GoStatus::Open, PactoError::InvalidStatus);
    let is_organizer = ctx.accounts.signer.key() == go.organizer;
    if !is_organizer {
        // Anyone may cancel after the deadline when the minimum failed, or
        // when the organizer has not locked within the grace period.
        require!(ts >= go.join_deadline, PactoError::DeadlineNotReached);
        let min_failed = go.total_qty < go.min_qty;
        let organizer_silent = ts >= go.lock_grace_end();
        require!(min_failed || organizer_silent, PactoError::MinimumAlreadyMet);
    }
    go.status = GoStatus::Cancelled;
    emit!(Cancelled { group_order: go.key(), by: ctx.accounts.signer.key(), ts });
    Ok(())
}

#[derive(Accounts)]
pub struct MarkShipped<'info> {
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = organizer @ PactoError::Unauthorized,
    )]
    pub group_order: Account<'info, GroupOrder>,
}

pub fn mark_shipped(ctx: Context<MarkShipped>, shipment_ref: String) -> Result<()> {
    require!(shipment_ref.len() <= MAX_SHIPMENT_REF_LEN, PactoError::RefTooLong);
    let ts = now()?;
    let go = &mut ctx.accounts.group_order;
    require!(go.status == GoStatus::Locked, PactoError::InvalidStatus);
    // A late shipment is still accepted as long as no buyer has started
    // reclaiming funds; once the wind-down began, shipping is closed.
    require!(go.settled == 0, PactoError::WindDown);
    go.status = GoStatus::Shipped;
    go.shipped_at = ts;
    go.shipment_ref = shipment_ref.clone();
    emit!(Shipped { group_order: go.key(), shipment_ref, ts });
    Ok(())
}

/// Once a group order is terminal and every participation is settled, the
/// organizer sweeps rounding dust and closes the vault to recover rent.
#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = organizer @ PactoError::Unauthorized,
        has_one = mint @ PactoError::MintMismatch,
        has_one = vault,
    )]
    pub group_order: Account<'info, GroupOrder>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = organizer,
        associated_token::mint = mint,
        associated_token::authority = organizer,
        associated_token::token_program = token_program,
    )]
    pub organizer_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
    let go = &ctx.accounts.group_order;
    let terminal = matches!(
        go.status,
        GoStatus::Completed | GoStatus::Cancelled | GoStatus::Expired
    );
    require!(terminal, PactoError::InvalidStatus);
    // Every participant must have settled (claimed, confirmed, released or
    // resolved) so only rounding dust remains.
    require!(go.settled >= go.participants, PactoError::VaultNotEmpty);

    let dust = ctx.accounts.vault.amount;
    vault_transfer(
        go,
        &ctx.accounts.vault,
        &ctx.accounts.organizer_token_account,
        &ctx.accounts.mint,
        &ctx.accounts.token_program,
        dust,
    )?;

    let go_id_bytes = go.go_id.to_le_bytes();
    let seeds = go.signer_seeds(&go_id_bytes);
    let signer_seeds: &[&[&[u8]]] = &[&seeds];
    token_interface::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.organizer.to_account_info(),
            authority: go.to_account_info(),
        },
        signer_seeds,
    ))
}
