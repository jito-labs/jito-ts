import {PublicKey, Transaction} from '@solana/web3.js';
import {Meta, Packet, PacketFlags} from '../gen/packet';

// Choose any of these seeds to derive the PDA used for tipping.
const TIP_SEEDS = [
  'TIP_ACCOUNT_0',
  'TIP_ACCOUNT_1',
  'TIP_ACCOUNT_2',
  'TIP_ACCOUNT_3',
  'TIP_ACCOUNT_4',
  'TIP_ACCOUNT_5',
  'TIP_ACCOUNT_6',
  'TIP_ACCOUNT_7',
];

export const deriveTipAddress = (
  tipPaymentProgramId: PublicKey,
  tipSeedIdx: number
): PublicKey => {
  const [tipPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(TIP_SEEDS[tipSeedIdx], 'utf8')],
    tipPaymentProgramId
  );

  return tipPda;
};

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
