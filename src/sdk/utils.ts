import {Transaction} from '@solana/web3.js';

import {Meta, Packet} from '../gen/packet';

export const unixTimestampFromDate = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

export const deserializeTransactions = (packets: Packet[]): Transaction[] => {
  return packets.map(p => {
    return Transaction.from(p.data);
  });
};

export const serializeTransactions = (txs: Transaction[]): Packet[] => {
  return txs.map(tx => {
    const data = tx.serialize({
      requireAllSignatures: true,
      verifySignatures: true,
    });

    return {
      data,
      meta: {
        port: 0,
        addr: '0.0.0.0',
        senderStake: 0,
        size: data.length,
        flags: undefined,
      } as Meta,
    } as Packet;
  });
};

export const isError = <T>(value: T | Error): value is Error => {
  return value instanceof Error;
};
