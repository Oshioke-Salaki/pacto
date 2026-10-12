//! Buyer-initiated exits: `leave` while Open, `claim_refund` after
//! cancellation or an expired ship-by window.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::constants::*;
use crate::errors::PactoError;
use crate::events::{Completed, Left, Refunded};
use crate::instructions::shared::{now, vault_transfer};
use crate::math::remainder;
use crate::state::{GoStatus, GroupOrder, Participation};

#[derive(Accounts)]
pub struct BuyerExit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [GROUP_ORDER_SEED, group_order.organizer.as_ref(), &group_order.go_id.to_le_bytes()],
        bump = group_order.bump,
        has_one = mint @ PactoError::MintMismatch,
        has_one = vault,
    )]
    pub group_order: Account<'info, GroupOrder>,
    #[account(
        mut,
        close = buyer,
        seeds = [PARTICIPATION_SEED, group_order.key().as_ref(), buyer.key().as_ref()],
        bump = participation.bump,
        has_one = buyer @ PactoError::Unauthorized,
        has_one = group_order,
    )]
    pub participation: Account<'info, Participation>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn leave(ctx: Context<BuyerExit>) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    require!(go.status == GoStatus::Open, PactoError::InvalidStatus);
    // Once the deadline passes with the minimum met, positions are committed
    // so the organizer can safely place the bulk order.
    require!(ts < go.join_deadline || go.total_qty < go.min_qty, PactoError::Committed);

    let p = &ctx.accounts.participation;
    let amount = p.paid;
    vault_transfer(
        go,
        &ctx.accounts.vault,
        &ctx.accounts.buyer_token_account,
        &ctx.accounts.mint,
        &ctx.accounts.token_program,
        amount,
    )?;

    let qty = p.qty;
    let go = &mut ctx.accounts.group_order;
    go.total_qty = go.total_qty.checked_sub(qty).ok_or(PactoError::MathOverflow)?;
    go.total_paid = go.total_paid.checked_sub(amount).ok_or(PactoError::MathOverflow)?;
    go.participants = go.participants.checked_sub(1).ok_or(PactoError::MathOverflow)?;

    emit!(Left {
        group_order: go.key(),
        buyer: ctx.accounts.buyer.key(),
        amount,
        ts,
    });
    Ok(())
}

pub fn claim_refund(ctx: Context<BuyerExit>) -> Result<()> {
    let ts = now()?;
    let go = &ctx.accounts.group_order;
    let p = &ctx.accounts.participation;

    let amount = match go.status {
        GoStatus::Cancelled => p.paid,
        GoStatus::Locked => {
            // Organizer never shipped in time.
            require!(ts > go.ship_by(), PactoError::WindowNotExpired);
            remainder(p.paid, go.advance_bps)?
        }
        GoStatus::Shipped => {
            // Dispute left unresolved by the arbiter past the arbitration window.
            require!(p.disputed, PactoError::NotDisputed);
            require!(ts > go.arbitration_end(), PactoError::WindowNotExpired);
            remainder(p.paid, go.advance_bps)?
        }
        _ => return err!(PactoError::InvalidStatus),
    };

    vault_transfer(
        go,
        &ctx.accounts.vault,
        &ctx.accounts.buyer_token_account,
        &ctx.accounts.mint,
        &ctx.accounts.token_program,
        amount,
    )?;

    let go = &mut ctx.accounts.group_order;
    go.settled = go.settled.checked_add(1).ok_or(PactoError::MathOverflow)?;
    if go.settled >= go.participants {
        match go.status {
            GoStatus::Locked => {
                go.status = GoStatus::Expired;
                emit!(Completed { group_order: go.key(), status: GoStatus::Expired as u8, ts });
            }
            GoStatus::Shipped => {
                go.status = GoStatus::Completed;
                emit!(Completed { group_order: go.key(), status: GoStatus::Completed as u8, ts });
            }
            _ => {}
        }
    }

    emit!(Refunded {
        group_order: go.key(),
        buyer: ctx.accounts.buyer.key(),
        amount,
        ts,
    });
    Ok(())
}
