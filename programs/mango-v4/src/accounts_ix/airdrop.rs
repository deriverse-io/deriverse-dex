use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{ Mint, Token, TokenAccount};

use crate::state::*;

#[derive(Accounts)]
pub struct Airdrop<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub reserve_account: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = user, associated_token::mint = mint, associated_token::authority = user)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    /// CHECK: This is safe because program authority is a PDA derived from a known seed and program ID.
    pub program_authority: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        init_if_needed,
        seeds = [b"airdrop", user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 1 // 1 byte for the boolean flag
    )]
    pub airdrop_info: Account<'info, AirdropInfo>,
}
