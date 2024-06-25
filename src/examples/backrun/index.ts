require('dotenv').config();

import {Keypair, Connection, PublicKey} from '@solana/web3.js';
import * as Fs from 'fs';

import {searcherClient} from '../../sdk/block-engine/searcher';
import {onBundleResult} from './utils';

const main = async () => {
  const blockEngineUrl = process.env.BLOCK_ENGINE_URL || '';
  console.log('BLOCK_ENGINE_URL:', blockEngineUrl);

  const authKeypairPath = process.env.AUTH_KEYPAIR_PATH || '';
  console.log('AUTH_KEYPAIR_PATH:', authKeypairPath);
  const decodedKey = new Uint8Array(
    JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[]
  );
  const keypair = Keypair.fromSecretKey(decodedKey);

  const bundleTransactionLimit = parseInt(
    process.env.BUNDLE_TRANSACTION_LIMIT || '0'
  );

  // Set NO_AUTH = true to bypass authentication
  const noAuth = process.env.NO_AUTH || '';
  console.log('NO_AUTH:', noAuth);
  const c =
    noAuth === 'true'
      ? searcherClient(blockEngineUrl, undefined)
      : searcherClient(blockEngineUrl, keypair);

  const rpcUrl = process.env.RPC_URL || '';
  console.log('RPC_URL:', rpcUrl);
  const conn = new Connection(rpcUrl, 'confirmed');

  onBundleResult(c);
};

main()
  .then(() => {
  })
  .catch(e => {
    throw e;
  });
