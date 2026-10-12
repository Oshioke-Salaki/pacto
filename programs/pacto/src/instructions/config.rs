use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::PactoError;
use crate::state::Config;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeConfigArgs {
    pub allowed_mint: Pubkey,
    pub fee_bps: u16,
    pub max_advance_bps: u16,
    pub treasury: Pubkey,
    pub default_arbiter: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_config(ctx: Context<InitializeConfig>, args: InitializeConfigArgs) -> Result<()> {
    require!(args.fee_bps <= MAX_FEE_BPS, PactoError::InvalidFee);
    require!(args.max_advance_bps <= MAX_ALLOWED_ADVANCE_BPS, PactoError::InvalidAdvance);
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.treasury = args.treasury;
    config.default_arbiter = args.default_arbiter;
    config.allowed_mint = args.allowed_mint;
    config.fee_bps = args.fee_bps;
    config.max_advance_bps = args.max_advance_bps;
    config.paused = false;
    config.bump = ctx.bumps.config;
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateConfigArgs {
    pub allowed_mint: Option<Pubkey>,
    pub fee_bps: Option<u16>,
    pub max_advance_bps: Option<u16>,
    pub treasury: Option<Pubkey>,
    pub default_arbiter: Option<Pubkey>,
    pub paused: Option<bool>,
    pub new_admin: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump, has_one = admin @ PactoError::Unauthorized)]
    pub config: Account<'info, Config>,
}

pub fn update_config(ctx: Context<UpdateConfig>, args: UpdateConfigArgs) -> Result<()> {
    let config = &mut ctx.accounts.config;
    if let Some(allowed_mint) = args.allowed_mint {
        config.allowed_mint = allowed_mint;
    }
    if let Some(fee_bps) = args.fee_bps {
        require!(fee_bps <= MAX_FEE_BPS, PactoError::InvalidFee);
        config.fee_bps = fee_bps;
    }
    if let Some(max_advance_bps) = args.max_advance_bps {
        require!(max_advance_bps <= MAX_ALLOWED_ADVANCE_BPS, PactoError::InvalidAdvance);
        config.max_advance_bps = max_advance_bps;
    }
    if let Some(treasury) = args.treasury {
        config.treasury = treasury;
    }
    if let Some(default_arbiter) = args.default_arbiter {
        config.default_arbiter = default_arbiter;
    }
    if let Some(paused) = args.paused {
        config.paused = paused;
    }
    if let Some(new_admin) = args.new_admin {
        config.admin = new_admin;
    }
    Ok(())
}
