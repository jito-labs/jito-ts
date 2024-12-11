import {VersionedTransaction} from '@solana/web3.js';

import {Meta, Packet} from '../../gen/block-engine/packet';

export type Result<T, E> = {
  ok: true;
  value: T;
} | {
  ok: false;
  error: E;
};

export function Ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function Err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}

export const unixTimestampFromDate = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

export const deserializeTransactions = (
  packets: Packet[]
): VersionedTransaction[] => {
  return packets.map(p => {
    return VersionedTransaction.deserialize(p.data);
  });
};

export const serializeTransactions = (
  txs: VersionedTransaction[]
): Packet[] => {
  return txs.map(tx => {
    const data = tx.serialize();

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
