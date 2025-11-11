# Tip Jar Frontend (Solana + Anchor + Next.js)

This is the frontend web application for the **Tip Jar** decentralized app.  

It allows users to:

- Connect their Solana wallet (Phantom, Solflare, etc.)
- Initialize their own on-chain **vault** for receiving tips
- Send SOL tips to any creator by wallet address
- Withdraw funds from their vault if they are the vault owner

This UI communicates directly with the deployed Solana program on **Devnet** using Anchor’s JavaScript client.

---

## Live App

**Deployed URL:** https://crypto-finders-projects.vercel.app

---

## Tech Stack

Component | Technology 
----------|------------
Framework | Next.js (React)
Wallet Integration | @solana/wallet-adapter 
Solana Client | @project-serum/anchor + @solana/web3.js 
Styling | Default / Inline minimal UI 

---

## Environment Setup

Create a `.env.local` file in the `/frontend` directory:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_TIP_JAR_PROGRAM_ID=TipJar1111111111111111111111111111111111111

Running the Frontend Locally

Install dependencies
pnpm install
pnpm build

Start the development server
pnpm dev


The app will be available at:

http://localhost:3000

