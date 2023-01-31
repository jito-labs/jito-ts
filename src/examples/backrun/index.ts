import {Bundle} from '../../sdk/types';

require('dotenv').config();

import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {searcherClient} from '../../sdk/searcher';

import * as Fs from 'fs';
import {deriveTipAddress, isError} from '../../sdk/utils';

const main = async () => {
  const blockEngineUrl = process.env.BLOCK_ENGINE_URL || '';
  console.log('BLOCK_ENGINE_URL:', blockEngineUrl);

  const authKeypairPath = process.env.AUTH_KEYPAIR_PATH || '';
  console.log('AUTH_KEYPAIR_PATH:', authKeypairPath);
  const decodedKey = new Uint8Array(
    JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[]
  );
  const keypair = Keypair.fromSecretKey(decodedKey);

  const _accounts = process.env.ACCOUNTS_OF_INTEREST || '';
  console.log('ACCOUNTS_OF_INTEREST:', _accounts);
  const accounts = _accounts.split(',');

  const bundleTransactionLimit = parseInt(
    process.env.BUNDLE_TRANSACTION_LIMIT || '0'
  );

  const c = searcherClient(blockEngineUrl, keypair);

  const rpcUrl = process.env.RPC_URL || '';
  console.log('RPC_URL:', rpcUrl);
  const conn = new Connection(rpcUrl, 'confirmed');

  const _tipPaymentProgram = process.env.TIP_PAYMENT_PROGRAM || '';
  console.log('TIP_PAYMENT_PROGRAM:', _tipPaymentProgram);
  const tipPaymentProgram = new PublicKey(_tipPaymentProgram);
  const tipPda = deriveTipAddress(tipPaymentProgram, 0);

  c.onPendingTransactions(
    accounts,
    async (transactions: Transaction[]) => {
      console.log('received transactions:', transactions);

      const resp = await conn.getLatestBlockhash('processed');

      const bundles = transactions.map(tx => {
        const b = new Bundle([tx], bundleTransactionLimit);
        return b;

        // let maybeBundle = b.addSignedTransactions(
        //   buildMemoTransaction(keypair, resp.blockhash)
        // );
        // if (isError(maybeBundle)) {
        //   throw maybeBundle;
        // }
        //
        // maybeBundle = maybeBundle.attachTip(
        //   keypair,
        //   100_000_000,
        //   tipPda,
        //   resp.blockhash
        // );
        // if (isError(maybeBundle)) {
        //   throw maybeBundle;
        // }
        //
        // return maybeBundle;
      });

      bundles.map(async b => {
        try {
          const resp = await c.sendBundle(b);
          console.log('resp:', resp);
        } catch (e) {
          console.log('error:', e);
        }
      });
    },
    (e: Error) => {
      throw e;
    }
  );
};

main()
  .then(() => {
    console.log('Back running:', process.env.ACCOUNTS_OF_INTEREST);
  })
  .catch(e => {
    throw e;
  });

const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo';

const buildMemoTransaction = (
  keypair: Keypair,
  recentBlockhash: string
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
  tx.add(ix);
  tx.sign({
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  });

  return tx;
};
