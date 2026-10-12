//! Integer money math. Every function is total (never panics) and rounds in
//! the direction that keeps the vault solvent.
//!
//! Rounding policy:
//! - The organizer advance at lock is `floor(total_paid * advance_bps / 10000)`.
//! - Each buyer's advance share is `ceil(paid * advance_bps / 10000)`.
//!   The sum of per-buyer ceilings is always >= the floored total, so the sum
//!   of per-buyer remainders (`paid - share`) is always <= what the vault still
//!   holds after the advance. Up to one base unit per buyer may stay in the
//!   vault as dust; `close_vault` returns it to the organizer.
//! - Protocol fees are `floor(amount * fee_bps / 10000)`.

use crate::constants::BPS_DENOMINATOR;
use crate::errors::PactoError;
use anchor_lang::prelude::*;

pub fn mul_bps_floor(amount: u64, bps: u16) -> Result<u64> {
    let v = (amount as u128)
        .checked_mul(bps as u128)
        .ok_or(PactoError::MathOverflow)?
        / (BPS_DENOMINATOR as u128);
    u64::try_from(v).map_err(|_| PactoError::MathOverflow.into())
}

pub fn mul_bps_ceil(amount: u64, bps: u16) -> Result<u64> {
    let num = (amount as u128)
        .checked_mul(bps as u128)
        .ok_or(PactoError::MathOverflow)?;
    let den = BPS_DENOMINATOR as u128;
    let v = (num + den - 1) / den;
    u64::try_from(v).map_err(|_| PactoError::MathOverflow.into())
}

/// Split a gross payout into (net_to_recipient, fee).
pub fn split_fee(gross: u64, fee_bps: u16) -> Result<(u64, u64)> {
    let fee = mul_bps_floor(gross, fee_bps)?;
    let net = gross.checked_sub(fee).ok_or(PactoError::MathOverflow)?;
    Ok((net, fee))
}

/// Buyer's remainder still held in the vault after the advance.
pub fn remainder(paid: u64, advance_bps: u16) -> Result<u64> {
    let share = mul_bps_ceil(paid, advance_bps)?;
    paid.checked_sub(share).ok_or(PactoError::MathOverflow.into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ceil_sum_covers_floor_total() {
        // Many small payments with an awkward bps must never make the vault insolvent.
        let payments = [1_000_001u64, 333_333, 7, 999_999, 1];
        let bps = 3_333u16;
        let total: u64 = payments.iter().sum();
        let advance_total = mul_bps_floor(total, bps).unwrap();
        let shares: u64 = payments.iter().map(|p| mul_bps_ceil(*p, bps).unwrap()).sum();
        assert!(shares >= advance_total);
        let remainders: u64 = payments.iter().map(|p| remainder(*p, bps).unwrap()).sum();
        assert!(remainders <= total - advance_total);
    }

    #[test]
    fn zero_bps_is_identity() {
        assert_eq!(remainder(500, 0).unwrap(), 500);
        assert_eq!(split_fee(500, 0).unwrap(), (500, 0));
    }

    #[test]
    fn fee_floors() {
        // 150 bps of 999 = 14.985 -> 14
        assert_eq!(split_fee(999, 150).unwrap(), (985, 14));
    }
}
