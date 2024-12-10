import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';

import {SearcherClient, SearcherClientError} from '../../sdk/block-engine/searcher';
import {Bundle} from '../../sdk/block-engine/types';
import {isError, Result} from '../../sdk/block-engine/utils';

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo';

export const sendBundles = async (
  c: SearcherClient,
  bundleTransactionLimit: number,
  keypair: Keypair,
  conn: Connection
): Promise<Result<string[], SearcherClientError>> => {
  try {
    const tipAccountResult = await c.getTipAccounts();
    if (!tipAccountResult.ok) {
      return tipAccountResult;
    }
    const _tipAccount = tipAccountResult.value[0];
    console.log('tip account:', _tipAccount);
    const tipAccount = new PublicKey(_tipAccount);

    const balance = await conn.getBalance(keypair.publicKey);
    console.log('current account has balance: ', balance);

    let isLeaderSlot = false;
    while (!isLeaderSlot) {
      const next_leader = await c.getNextScheduledLeader();
      if (!next_leader.ok) {
        return next_leader;
      }
      const num_slots = next_leader.value.nextLeaderSlot - next_leader.value.currentSlot;
      isLeaderSlot = num_slots <= 2;
      console.log(`next jito leader slot in ${num_slots} slots`);
      await new Promise(r => setTimeout(r, 500));
    }

    const blockHash = await conn.getLatestBlockhash();
    const b = new Bundle([], bundleTransactionLimit);

    console.log(blockHash.blockhash);

    const bundles = [b];

    let maybeBundle = b.addTransactions(
      buildMemoTransaction(keypair, 'jito test 1', blockHash.blockhash),
      buildMemoTransaction(keypair, 'jito test 2', blockHash.blockhash)
    );
    if (isError(maybeBundle)) {
      return { 
        ok: false, 
        error: new SearcherClientError(
          3, // INVALID_ARGUMENT
          'Failed to add transactions to bundle',
          maybeBundle.message
        )
      };
    }

    maybeBundle = maybeBundle.addTipTx(
      keypair,
      100_000,
      tipAccount,
      blockHash.blockhash
    );

    if (isError(maybeBundle)) {
      return { 
        ok: false, 
        error: new SearcherClientError(
          3, // INVALID_ARGUMENT
          'Failed to add tip transaction to bundle',
          maybeBundle.message
        )
      };
    }

    type BundleResponse = Result<string, SearcherClientError>;
    const results: BundleResponse[] = await Promise.all(
      bundles.map(async b => {
        try {
          const resp = await c.sendBundle(b);
          if (!resp.ok) {
            return resp;
          }
          console.log('resp:', resp.value);
          return resp;
        } catch (e) {
          console.error('error sending bundle:', e);
          return { 
            ok: false, 
            error: e as SearcherClientError 
          };
        }
      })
    );

    // Check if any bundle sends failed
    const error = results.find(r => !r.ok);
    if (error && !error.ok) {
      return { ok: false, error: error.error };
    }

    // At this point we know all results are successful
    const successResults = results.filter((r): r is { ok: true; value: string } => r.ok);
    return { ok: true, value: successResults.map(r => r.value) };

  } catch (e) {
    return { 
      ok: false, 
      error: e as SearcherClientError 
    };
  }
};

export const onBundleResult = (c: SearcherClient) => {
  return c.onBundleResult(
    result => {
      console.log('received bundle result:', result);
    },
    e => {
      console.error('Bundle result error:', e);
      throw e;
    }
  );
};

const buildMemoTransaction = (
  keypair: Keypair,
  message: string,
  recentBlockhash: string
): VersionedTransaction => {
  const ix = new TransactionInstruction({
    keys: [
      {
        pubkey: keypair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(message),
  });

  const instructions = [ix];

  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: recentBlockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);

  tx.sign([keypair]);

  console.log('txn signature is: ', bs58.encode(tx.signatures[0]));
  return tx;
};