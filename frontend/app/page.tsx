'use client';
import dynamic from "next/dynamic";
import BN from "bn.js";
import React, { useMemo, useState } from 'react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';
import idl from "../idl/tip_jar.json";

const PROGRAM_ID = new PublicKey(idl.address); 
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || anchor.web3.clusterApiUrl('devnet');

function UI() {
  const wallet = useWallet();
  const [creator, setCreator] = useState('');
  const [amountSol, setAmountSol] = useState('0.01');
  const [status, setStatus] = useState<string>('');

  const connection = useMemo(() => new Connection(RPC, 'confirmed'), []);
  const provider = useMemo(() => new anchor.AnchorProvider(connection, wallet as any, {}), [connection, wallet]);
  const programId = PROGRAM_ID;
  const program = useMemo(() => {
  if (!wallet.publicKey) return null; 
  return new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);
}, [provider, wallet.publicKey]);

  const deriveVault = async (auth: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), auth.toBuffer()],
    PROGRAM_ID
  )[0];
};

  const handleInitialize = async () => {
    if (!wallet.publicKey) return;
    if (!program) return setStatus("Wallet not connected yet.");
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
      if (!program) return setStatus("Wallet not connected yet.");
      const auth = new PublicKey(creator);
      const vault = await deriveVault(auth);
      const lamports = Math.floor(parseFloat(amountSol) * LAMPORTS_PER_SOL);
      setStatus('Sending tip...');
      await program.methods.tip(new BN(lamports)).accounts({
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
      if (!program) return setStatus("Wallet not connected yet.");
      const vault = await deriveVault(wallet.publicKey);
      const lamports = Math.floor(parseFloat(amountSol) * LAMPORTS_PER_SOL);
      setStatus('Withdrawing...');
      await program.methods.withdraw(new BN(lamports)).accounts({
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

function Page() {
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

export default dynamic(() => Promise.resolve(Page), { ssr: false });
