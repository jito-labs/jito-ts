import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {SearcherClient} from '../../sdk/block-engine/searcher';
import {Bundle} from '../../sdk/block-engine/types';
import {isError} from '../../sdk/block-engine/utils';

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo';

export const onAccountUpdates = async (
  c: SearcherClient,
  accounts: PublicKey[],
  bundleTransactionLimit: number,
  keypair: Keypair,
  conn: Connection
) => {
  const _tipAccount = (await c.getTipAccounts())[0];
  console.log('tip account:', _tipAccount);
  const tipAccount = new PublicKey(_tipAccount);
  c.onAccountUpdate(
    accounts,
    async (transactions: Transaction[]) => {
      console.log(`received ${transactions.length} transactions`);

      const resp = await conn.getLatestBlockhash('processed');

      const bundles = transactions.map(tx => {
        const b = new Bundle([tx], bundleTransactionLimit);

        let maybeBundle = b.addSignedTransactions(
          buildMemoTransaction(
            keypair,
            resp.blockhash,
            resp.lastValidBlockHeight
          )
        );
        if (isError(maybeBundle)) {
          throw maybeBundle;
        }

        maybeBundle = maybeBundle.attachTip(
          keypair,
          100_000_000,
          tipAccount,
          resp.blockhash,
          resp.lastValidBlockHeight
        );

        if (isError(maybeBundle)) {
          throw maybeBundle;
        }

        return maybeBundle;
      });

      bundles.map(async b => {
        try {
          const resp = await c.sendBundle(b);
          console.log('resp:', resp);
        } catch (e) {
          console.error('error:', e);
          throw e;
        }
      });
    },
    (e: Error) => {
      throw e;
    }
  );
};

export const onBundleResult = (c: SearcherClient) => {
  c.onBundleResult(
    result => {
      console.log('received bundle result:', result);
    },
    e => {
      throw e;
    }
  );
};

const buildMemoTransaction = (
  keypair: Keypair,
  recentBlockhash: string,
  lastValidBlockHeight: number
): Transaction => {
  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: keypair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from('Jito Backrun'),
  });

  const tx = new Transaction();
  tx.recentBlockhash = recentBlockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  tx.add(ix);
  tx.sign({
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  });

  return tx;
};
