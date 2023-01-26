import {Transaction} from '@solana/web3.js';

import {Bundle as IBundle} from '../gen/bundle';
import {Header} from '../gen/shared';
import {Packet} from '../gen/packet';
import {serializeTransactions} from "./utils";

// Represents a bundle of transactions expected to execute all or nothing, atomically and sequentially.
export class Bundle implements IBundle {
  private transactions: Transaction[];
  header: Header | undefined;
  packets: Packet[];

  constructor(txs: Transaction[]) {
    this.transactions = txs;
    this.packets = serializeTransactions(txs);
  }

  add(...txs: Transaction[]): Bundle {
    this.transactions.push(...txs);
    this.packets.concat(serializeTransactions(txs));
    return this;
  }
}
