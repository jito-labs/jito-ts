require('dotenv').config();

import {Transaction} from "@solana/web3.js";
import {searcherClient} from '../../sdk/searcher';

import {Keypair} from '@solana/web3.js';
import * as Fs from 'fs';

const main = async () => {
  const blockEngineUrl =
    process.env.BLOCK_ENGINE_URL || '';
  console.log('BLOCK_ENGINE_URL:', blockEngineUrl);

  const authKeypairPath =
    process.env.AUTH_KEYPAIR_PATH || '';
  console.log('AUTH_KEYPAIR_PATH:', authKeypairPath);
  const decodedKey = new Uint8Array(
    JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[]
  );
  const keypair = Keypair.fromSecretKey(decodedKey);

  const _accounts = process.env.ACCOUNTS_OF_INTEREST || '';
  console.log('ACCOUNTS_OF_INTEREST:', _accounts);
  const accounts = _accounts.split(',');

  const c = searcherClient(blockEngineUrl, keypair);

  c.onPendingTransactions(
    accounts,
    (transactions: Transaction[]) => {
      console.log('received transactions:', transactions);
    },
    (e: Error) => {
      throw e;
    }
  );
};

main()
  .then(() => {
  })
  .catch(e => {
  });
