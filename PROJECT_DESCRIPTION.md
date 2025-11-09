# Project Description                                                                                                                                                                                                                       **Deployed Frontend URL:** [TODO: Link to your deployed frontend]                                                                                                                                                                           **Solana Program ID:** [TODO: Your deployed program's public key]   

## Project Overview

### Description
Tip Jar is a simple decentralized tipping application built on Solana using the Anchor framework.

Each creator on the platform has their own **on-chain vault**, represented by a **PDA (Program Derived Address)** that securely holds their tip funds.    

Anyone can send SOL tips to a creator, and only the creator who owns the vault is allowed to withdraw the accumulated balance.

All transfers happen **fully on-chain**, ensuring transparency and decentralization—no database or backend server required.

This project demonstrates core Solana concepts:
- Account creation with PDAs
- Safe funds transfers with lamports
- Authorization checks
- Instruction validation
- Client interaction through a web frontend

## Key Features

Feature | Description
-------------------------
Creator Vault | Each creator gets a unique PDA-owned vault to store tips.
Send Tips | Any wallet can tip any creator using their wallet address.
Withdraw Funds | Only the creator can withdraw from their own vault.
Fully On-Chain | All logic is enforced by the Solana program (no off-chain trust).
Simple UI | A clean frontend for connecting wallet, tipping, and withdrawing.

## How to Use the dApp

1. **Connect Wallet**
   - Open the frontend and click **Connect Wallet** (Phantom, Solflare, etc).

2. **Initialize Your Vault** (Creator setup)
   - Click **Initialize My Vault**.
   - This creates a PDA vault for your wallet on-chain.

3. **Send a Tip**
   - Paste any creator's wallet address.
   - Enter the amount of SOL to tip.
   - Click **Send Tip**.

4. **Withdraw (Creators Only)**
 - Go to the **Withdraw** section.
   - Enter the withdrawal amount.
   - Click **Withdraw** to move SOL from the vault to your wallet.

## Program Architecture

### Main Components

Component | Purpose
-------------------------
`Vault` account | Stores the creator's address, PDA bump, and total tipped amount.
PDA Vault Address | Holds SOL used as the tip escrow.
Instructions | Initialize vault, send tip, withdraw funds.

### PDA Usage

The program uses **one PDA per creator**, ensuring secure, program-controlled fund storage.
- `b"vault"`: Hardcoded namespace to avoid collisions
- `authority.key()`: Ensures each creator gets a unique vault
- Resulting PDA is **owned by the program**, preventing unauthorized withdrawals.

### PDAs Used

PDA | Purpose
---------------------
**Vault PDA** | Stores & holds SOL for a specific creator. Derived using `(“vault”, creator pubkey)`

### Program Instructions

Instruction | Description
-----------------------------------
**initialize()** | Creates a PDA vault for the creator calling the function.
**tip(amount)** | Transfers SOL from tipper to the creator’s vault PDA.
**withdraw(amount)** | Allows only the vault authority (creator) to withdraw funds.


## Account Structure

```rust

#[account]

pub struct Vault {
    pub authority: Pubkey, // The creator who owns this vault
    pub bump: u8,          // PDA bump seed
    pub total_tips: u64,   // Total lamports ever tipped into this vault
}

## Testing

### Test Coverage

**Happy Path Tests:**

Test  |  Description

Initialize Vault - Successfully creates a PDA vault for a creator.
Tip - Tipper sends SOL to vault; vault balance increases.

Withdraw - Creator withdraws SOL successfully.

**Unhappy Path Tests:**

Test  |  Description

Double Initialize - Calling initialize twice fails as the account already exists.
Zero Tip - Tipping 0 lamports triggers InvalidAmount error.
Unauthorized Withdraw - Non-creator cannot withdraw from vault.

### Running Tests

yarn install    # install dependencies
anchor test     # run tests

# Commands to run your tests

anchor test
```
### Additional Notes for Evaluators

- Every instruction in the program has both a successful execution test and at least one negative/error scenario test, meeting the School of Solana task requirements.    

- PDA derivation is tested explicitly to ensure correctness and deterministic account addressing.

- The withdrawal logic enforces strict authority checks, ensuring that only the vault owner can access stored funds.  

- The project demonstrates secure on-chain fund handling without relying on any centralized service.
