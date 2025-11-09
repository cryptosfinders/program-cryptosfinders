# Tip Jar — Anchor Smart Contract (Solana Devnet)

This directory contains the **on-chain program** for the **Tip Jar** decentralized application.  
The program is written in **Rust** using the **Anchor framework** and is deployed on the **Solana Devnet**.

The program allows any user to create a **PDA vault** that can receive SOL tips from others.  
Only the owner of the vault is authorized to withdraw funds.

---

## Program Overview

Feature | Description 
--------|-------------
PDA Vault per Creator | Each creator initializes their own vault derived from their wallet address.
Send Tips | Anyone can send SOL tips to any creator.
Withdraw Funds | Only the creator (vault authority) can withdraw SOL from their vault.
Fully On-Chain | No backend server; state & transfers enforced on-chain.

---

## Program Structure

### PDA Derivation

Each vault account is derived with:
```rust
seeds = [b"vault", authority.key().as_ref()]

## Instructions

Instruction - Purpose
initialize() - Creates a vault PDA for the caller's wallet.
tip(amount) - Transfers SOL from the tipper to the creator’s vault PDA.
withdraw(amount) - Allows the vault owner to withdraw SOL to their wallet.

## Deploying the Program

Make sure Solana CLI and Anchor are installed.

## Set Devnet

solana config set --url https://api.devnet.solana.com
solana airdrop 2

## Build Program

anchor build

##  Get Program ID

anchor keys list

## Deploy to Devnet

anchor deploy

##  Running Tests

anchor test
