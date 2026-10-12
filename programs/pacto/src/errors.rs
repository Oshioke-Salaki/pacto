use anchor_lang::prelude::*;

#[error_code]
pub enum PactoError {
    #[msg("Protocol is paused")]
    Paused,
    #[msg("Action not allowed in the current status")]
    InvalidStatus,
    #[msg("Join deadline has passed")]
    DeadlinePassed,
    #[msg("Join deadline has not been reached")]
    DeadlineNotReached,
    #[msg("Minimum quantity not met")]
    MinimumNotMet,
    #[msg("Minimum quantity already met; cancel requires the organizer")]
    MinimumAlreadyMet,
    #[msg("Join would exceed the maximum quantity")]
    MaxQuantityExceeded,
    #[msg("Quantity must be at least 1 and min must not exceed max")]
    InvalidQuantity,
    #[msg("Unit price must be greater than zero")]
    InvalidPrice,
    #[msg("Advance exceeds the allowed maximum")]
    InvalidAdvance,
    #[msg("Fee exceeds the allowed maximum")]
    InvalidFee,
    #[msg("Deadline or window out of bounds")]
    InvalidWindow,
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("URI too long")]
    UriTooLong,
    #[msg("Shipment reference too long")]
    RefTooLong,
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("Receipt already confirmed")]
    AlreadyConfirmed,
    #[msg("Participation already in dispute")]
    AlreadyDisputed,
    #[msg("Participation is in dispute; wait for the arbiter")]
    InDispute,
    #[msg("Participation is not in dispute")]
    NotDisputed,
    #[msg("Time window has not expired yet")]
    WindowNotExpired,
    #[msg("Time window has expired")]
    WindowExpired,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Token account mint does not match the group order mint")]
    MintMismatch,
    #[msg("Vault still holds participant funds")]
    VaultNotEmpty,
    #[msg("Mint is not allowed by protocol config")]
    MintNotAllowed,
    #[msg("Organizer cannot be the arbiter of their own order")]
    ArbiterIsOrganizer,
    #[msg("Cannot leave after the deadline once the minimum is met")]
    Committed,
    #[msg("Cannot ship after buyers have started reclaiming funds")]
    WindDown,
}
