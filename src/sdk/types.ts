import {Keypair, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';

import {Bundle as IBundle} from '../gen/bundle';
import {Header} from '../gen/shared';
import {Packet} from '../gen/packet';
import {serializeTransactions} from './utils';

// Represents a bundle of transactions expected to execute all or nothing, atomically and sequentially.
export class Bundle implements IBundle {
  private transactions: Transaction[];
  // Maximum number of transactions a bundle may have.
  private readonly transactionLimit: number;
  header: Header | undefined;
  packets: Packet[];

  constructor(txs: Transaction[], transactionLimit: number) {
    this.transactions = txs;
    this.transactionLimit = transactionLimit;
    this.packets = serializeTransactions(txs);
  }

  // Adds signed transactions to the bundle. Filters out any txs failing signature verification.
  addSignedTransactions(...signedTransactions: Transaction[]): Bundle | Error {
    const numTransactions =
      this.transactions.length + signedTransactions.length;
    if (numTransactions > this.transactionLimit) {
      return new Error(
        `${numTransactions} exceeds transaction limit of ${this.transactionLimit}`
      );
    }

    // TODO: Is this expensive?
    if (this.transactions.some(tx => !tx.verifySignatures())) {
      return new Error('Some transaction failed signature verification');
    }

    this.transactions.push(...signedTransactions);
    this.packets.concat(serializeTransactions(signedTransactions));
    return this;
  }

  // Attaches a tip instruction to an existing transaction if provided otherwise creates a new transaction to tip.
  attachTip(
    keypair: Keypair,
    tipLamports: number,
    tipAccount: PublicKey,
    recentBlockhash: string,
    tx?: Transaction
  ): Bundle | Error {
    const numTransactions = this.transactions.length + 1;
    if (numTransactions > this.transactionLimit) {
      return new Error(
        `${numTransactions} exceeds transaction limit of ${this.transactionLimit}`
      );
    }

    let tipTx;
    const tipIx = SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: tipAccount,
      lamports: tipLamports,
    });

    if (!tx) {
      tipTx = new Transaction();
      tipTx.add(tipIx);
      tipTx.recentBlockhash = recentBlockhash;
      tipTx.sign({
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
      });
    } else if (!tx.verifySignatures()) {
      return new Error('Transaction failed signature verification');
    } else {
      tx.add(tipIx);
      tipTx = tx;
    }

    this.transactions.push(tipTx);
    this.packets.concat(serializeTransactions([tipTx]));

    return this;
  }
}
