'use client';
import React, { useMemo, useState } from 'react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_TIP_JAR_PROGRAM_ID!);
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || anchor.web3.clusterApiUrl('devnet');

function UI() {
  const wallet = useWallet();
  const [creator, setCreator] = useState('');
  const [amountSol, setAmountSol] = useState('0.01');
  const [status, setStatus] = useState<string>('');

  const connection = useMemo(() => new Connection(RPC, 'confirmed'), []);
  const provider = useMemo(() => new anchor.AnchorProvider(connection, wallet as any, {}), [connection, wallet]);
  const program = useMemo(() => new (anchor as any).Program({}, PROGRAM_ID, provider), [provider]);

  const deriveVault = async (auth: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), auth.toBuffer()], PROGRAM_ID);
    return pda;
  };

  const handleInitialize = async () => {
    if (!wallet.publicKey) return;
    try {
      setStatus('Initializing...');
      const vault = await deriveVault(wallet.publicKey);
      await program.methods.initialize().accounts({
        vault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();
      setStatus(`Initialized vault: ${vault.toBase58()}`);
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
  };

  const handleTip = async () => {
    try {
      if (!wallet.publicKey) return;
      const auth = new PublicKey(creator);
      const vault = await deriveVault(auth);
      const lamports = Math.floor(parseFloat(amountSol) * LAMPORTS_PER_SOL);
      setStatus('Sending tip...');
      await program.methods.tip(new anchor.BN(lamports)).accounts({
        vault,
        authority: auth,
        tipper: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();
      setStatus('Tipped successfully!');
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
  };

  const handleWithdraw = async () => {
    try {
      if (!wallet.publicKey) return;
      const vault = await deriveVault(wallet.publicKey);
      const lamports = Math.floor(parseFloat(amountSol) * LAMPORTS_PER_SOL);
      setStatus('Withdrawing...');
      await program.methods.withdraw(new anchor.BN(lamports)).accounts({
        vault,
        authority: wallet.publicKey,
      }).rpc();
      setStatus('Withdrawn!');
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>Tip Jar (Devnet)</h1>
      <WalletMultiButton />

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <button onClick={handleInitialize} disabled={!wallet.connected}>Initialize My Vault</button>

        <div>
          <h3>Tip a creator</h3>
          <input placeholder="Creator pubkey" value={creator} onChange={e => setCreator(e.target.value)} style={{ width: '100%' }} />
          <input placeholder="Amount in SOL" value={amountSol} onChange={e => setAmountSol(e.target.value)} />
          <button onClick={handleTip} disabled={!wallet.connected}>Send Tip</button>
        </div>

        <div>
          <h3>Withdraw (as creator)</h3>
          <input placeholder="Amount in SOL" value={amountSol} onChange={e => setAmountSol(e.target.value)} />
          <button onClick={handleWithdraw} disabled={!wallet.connected}>Withdraw</button>
        </div>

        <p><b>Status:</b> {status}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const network = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <UI />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
