use anchor_lang::prelude::*;
use anchor_spl::token::{self, TransferChecked};

use crate::accounts_ix::*;

pub fn airdrop(ctx: Context<Airdrop>) -> Result<()> {
    let amount: u64 = 10_000;
    let airdrop_info = &mut ctx.accounts.airdrop_info;

    if airdrop_info.has_received {
        return Ok(());
    }

    let (program_authority, bump_seed) =
        Pubkey::find_program_address(&[b"authority"], ctx.program_id);

    let seeds: &[&[u8]] = &[b"authority", &[bump_seed]];

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.reserve_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.program_authority.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    };
    let binding = [seeds];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(&binding);

    token::transfer_checked(cpi_ctx, amount * 1_000_000, 6)?; // Airdrop amount (e.g., amount * 1 token with 6 decimals)

    airdrop_info.has_received = true;

    Ok(())
}
