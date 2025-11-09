use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("TipJar1111111111111111111111111111111111111");

#[program]
pub mod tip_jar {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = *ctx.bumps.get("vault").unwrap();
        vault.total_tips = 0;
        Ok(())
    }

    pub fn tip(ctx: Context<Tip>, amount: u64) -> Result<()> {
        require!(amount > 0, TipError::InvalidAmount);

        // transfer lamports from tipper to PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.tipper.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[ctx.accounts.tipper.to_account_info(), ctx.accounts.system_program.to_account_info(), ctx.accounts.vault.to_account_info()],
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_tips = vault
            .total_tips
            .checked_add(amount)
            .ok_or(TipError::MathOverflow)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, TipError::InvalidAmount);
        let vault_ai = &ctx.accounts.vault;
        require_keys_eq!(vault_ai.authority, ctx.accounts.authority.key(), TipError::Unauthorized);

        let vault_lamports = **ctx.accounts.vault.to_account_info().lamports.borrow();
        require!(amount <= vault_lamports, TipError::InsufficientFunds);

        // move lamports from PDA to authority
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
        space = 8 + 32 + 1 + 8 // discriminator + authority + bump + total_tips
    )]
    pub vault: Account<'info, Vault>;

    #[account(mut)]
    pub authority: Signer<'info>;

    pub system_program: Program<'info, System>;
}

#[derive(Accounts)]
pub struct Tip<'info> {
    #[account(mut, seeds = [b"vault", authority.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>;

    /// CHECK: used for PDA seeds
    pub authority: UncheckedAccount<'info>;

    #[account(mut)]
    pub tipper: Signer<'info>;

    pub system_program: Program<'info, System>;
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [b"vault", authority.key().as_ref()], bump = vault.bump)]
    pub vault: Account<'info, Vault>;

    #[account(mut)]
    pub authority: Signer<'info>;
}

#[account]
pub struct Vault {
    pub authority: Pubkey;
    pub bump: u8;
    pub total_tips: u64;
}

#[error_code]
pub enum TipError {
    #[msg("Invalid amount")] 
    InvalidAmount,
    #[msg("Unauthorized")] 
    Unauthorized,
    #[msg("Insufficient funds in vault")] 
    InsufficientFunds,
    #[msg("Math overflow")] 
    MathOverflow,
}
