import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

// Replace with your actual ID or set env PROGRAM_ID
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);

describe("tip-jar", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program({} as any, PROGRAM_ID, provider);

  const authority = provider.wallet as anchor.Wallet;
  let vaultPda: PublicKey;
  let vaultBump: number;

  it("derive PDA", async () => {
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), authority.publicKey.toBuffer()],
      PROGRAM_ID
    );
    assert.ok(vaultPda);
  });

  it("initialize (happy)", async () => {
    await program.methods
      .initialize()
      .accounts({
        vault: vaultPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAcct: any = await (program as any).account.vault.fetch(vaultPda);
    assert.equal(vaultAcct.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(vaultAcct.bump, vaultBump);
  });

  it("initialize (unhappy) - already exists", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          vault: vaultPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (e: any) {
      assert.ok(e);
    }
  });

  it("tip (happy)", async () => {
    const amount = 0.1 * LAMPORTS_PER_SOL;

    await program.methods
      .tip(new anchor.BN(amount))
      .accounts({
        vault: vaultPda,
        authority: authority.publicKey,
        tipper: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultInfo = await provider.connection.getAccountInfo(vaultPda);
    assert.ok((vaultInfo?.lamports ?? 0) >= amount);
  });

  it("tip (unhappy) - zero amount", async () => {
    try {
      await program.methods
        .tip(new anchor.BN(0))
        .accounts({
          vault: vaultPda,
          authority: authority.publicKey,
          tipper: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.ok(e);
    }
  });

  it("withdraw (unhappy) - unauthorized", async () => {
    const other = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(other.publicKey, LAMPORTS_PER_SOL);

    try {
      await program.methods
        .withdraw(new anchor.BN(1))
        .accounts({
          vault: vaultPda,
          authority: other.publicKey,
        })
        .signers([other])
        .rpc();
      assert.fail("Should have thrown");
    } catch (e) {
      assert.ok(e);
    }
  });

  it("withdraw (happy)", async () => {
    const before = (await provider.connection.getAccountInfo(vaultPda))?.lamports ?? 0;
    const withdrawAmount = Math.floor(before / 2);

    await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accounts({
        vault: vaultPda,
        authority: authority.publicKey,
      })
      .rpc();

    const after = (await provider.connection.getAccountInfo(vaultPda))?.lamports ?? 0;
    assert.equal(after, before - withdrawAmount);
  });
});
