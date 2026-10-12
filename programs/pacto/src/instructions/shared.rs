//! Helpers shared by several instructions.

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::state::GroupOrder;

/// Transfer tokens out of the group order vault, signed by the GroupOrder PDA.
pub fn vault_transfer<'info>(
    group_order: &Account<'info, GroupOrder>,
    vault: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let go_id_bytes = group_order.go_id.to_le_bytes();
    let seeds = group_order.signer_seeds(&go_id_bytes);
    let signer_seeds: &[&[&[u8]]] = &[&seeds];
    let cpi_accounts = TransferChecked {
        from: vault.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: group_order.to_account_info(),
    };
    let ctx = CpiContext::new_with_signer(token_program.key(), cpi_accounts, signer_seeds);
    token_interface::transfer_checked(ctx, amount, mint.decimals)
}

pub fn now() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}
