//! Post-shipment settlement: confirm, dispute, resolve, release on timeout.
//! All four share one account set; the handler enforces who may sign.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::constants::*;
use crate::errors::PactoError;
use crate::events::{Completed, Confirmed, Disputed, Released, Resolved};
use crate::instructions::shared::{now, vault_transfer};
use crate::math::{remainder, split_fee};
use crate::state::{Config, GoStatus, GroupOrder, Participation};

#[derive(Accounts)]
pub struct Settle<'info> {
    /// Buyer for confirm, anyone for release_expired (permissionless crank),
    /// arbiter for resolve.
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = mint @ PactoError::MintMismatch,
        has_one = vault,
        has_one = organizer,
    )]
    pub group_order: Account<'info, GroupOrder>,
    #[account(
        mut,
        close = buyer,
        seeds = [PARTICIPATION_SEED, group_order.key().as_ref(), buyer.key().as_ref()],
        bump = participation.bump,
        has_one = buyer,
        has_one = group_order,
    )]
    pub participation: Account<'info, Participation>,
    /// CHECK: constrained by participation.buyer; receives rent and refunds.
    #[account(mut)]
    pub buyer: UncheckedAccount<'info>,
    /// CHECK: constrained by group_order.organizer; receives payouts.
    pub organizer: UncheckedAccount<'info>,
    /// CHECK: constrained to config.treasury.
    #[account(address = config.treasury)]
    pub treasury: UncheckedAccount<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    /// The three token accounts below are marked `dup` because roles may share
    /// a wallet (an organizer who joined their own order, or a treasury that
    /// is also the organizer).
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
        dup,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = organizer,
        associated_token::token_program = token_program,
        dup,
    )]
    pub organizer_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = treasury,
        associated_token::token_program = token_program,
        dup,
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Pay the buyer's remainder to the organizer (minus fee). Returns (net, fee).
fn pay_organizer(ctx: &Context<Settle>) -> Result<(u64, u64)> {
    let go = &ctx.accounts.group_order;
    let gross = remainder(ctx.accounts.participation.paid, go.advance_bps)?;
    let (net, fee) = split_fee(gross, go.fee_bps)?;
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
    Ok((net, fee))
}

fn settle_one(go: &mut Account<GroupOrder>, ts: i64) -> Result<()> {
    go.settled = go.settled.checked_add(1).ok_or(PactoError::MathOverflow)?;
    if go.settled >= go.participants {
        go.status = GoStatus::Completed;
        emit!(Completed { group_order: go.key(), status: GoStatus::Completed as u8, ts });
    }
    Ok(())
}

pub fn confirm_receipt(ctx: Context<Settle>) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    let p = &ctx.accounts.participation;
    require_keys_eq!(ctx.accounts.signer.key(), p.buyer, PactoError::Unauthorized);
    require!(go.status == GoStatus::Shipped, PactoError::InvalidStatus);
    require!(!p.disputed, PactoError::InDispute);

    let (net, fee) = pay_organizer(&ctx)?;
    let buyer = p.buyer;
    let go = &mut ctx.accounts.group_order;
    settle_one(go, ts)?;
    emit!(Confirmed { group_order: go.key(), buyer, released: net, fee, ts });
    Ok(())
}

pub fn release_expired(ctx: Context<Settle>) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    let p = &ctx.accounts.participation;
    // Permissionless: the payout always goes to the organizer's ATA, so a
    // crank may settle on behalf of an organizer who went quiet after shipping.
    require!(go.status == GoStatus::Shipped, PactoError::InvalidStatus);
    require!(!p.disputed, PactoError::InDispute);
    require!(ts > go.deliver_by(), PactoError::WindowNotExpired);

    let (net, fee) = pay_organizer(&ctx)?;
    let buyer = p.buyer;
    let go = &mut ctx.accounts.group_order;
    settle_one(go, ts)?;
    emit!(Released { group_order: go.key(), buyer, released: net, fee, ts });
    Ok(())
}

pub fn resolve_dispute(ctx: Context<Settle>, refund_buyer: bool) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    let p = &ctx.accounts.participation;
    require_keys_eq!(ctx.accounts.signer.key(), go.arbiter, PactoError::Unauthorized);
    require!(go.status == GoStatus::Shipped, PactoError::InvalidStatus);
    require!(p.disputed, PactoError::NotDisputed);

    let buyer = p.buyer;
    let amount = if refund_buyer {
        let gross = remainder(p.paid, go.advance_bps)?;
        vault_transfer(
            go,
            &ctx.accounts.vault,
            &ctx.accounts.buyer_token_account,
            &ctx.accounts.mint,
            &ctx.accounts.token_program,
            gross,
        )?;
        gross
    } else {
        pay_organizer(&ctx)?.0
    };

    let go = &mut ctx.accounts.group_order;
    if refund_buyer {
        go.disputes_lost = go.disputes_lost.checked_add(1).ok_or(PactoError::MathOverflow)?;
    }
    settle_one(go, ts)?;
    emit!(Resolved { group_order: go.key(), buyer, refunded_buyer: refund_buyer, amount, ts });
    Ok(())
}

/// Disputes do not move funds, so they use a lighter account set.
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
    )]
    pub group_order: Account<'info, GroupOrder>,
    #[account(
        mut,
        seeds = [PARTICIPATION_SEED, group_order.key().as_ref(), buyer.key().as_ref()],
        bump = participation.bump,
        has_one = buyer @ PactoError::Unauthorized,
        has_one = group_order,
    )]
    pub participation: Account<'info, Participation>,
}

pub fn open_dispute(ctx: Context<OpenDispute>) -> Result<()> {
    let ts = now()?;
    let go = &mut ctx.accounts.group_order;
    let p = &mut ctx.accounts.participation;
    require!(go.status == GoStatus::Shipped, PactoError::InvalidStatus);
    require!(ts <= go.deliver_by(), PactoError::WindowExpired);
    require!(!p.disputed, PactoError::AlreadyDisputed);
    p.disputed = true;
    go.disputes_opened = go.disputes_opened.checked_add(1).ok_or(PactoError::MathOverflow)?;
    emit!(Disputed { group_order: go.key(), buyer: p.buyer, ts });
    Ok(())
}
