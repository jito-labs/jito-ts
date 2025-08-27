require('dotenv').config();

import * as Fs from 'fs';
import {Keypair, Connection} from '@solana/web3.js';
import {searcherClient} from '../../sdk/block-engine/searcher';
import {BundleResult} from '../../gen/block-engine/bundle';
import {sendBundles} from './utils';

const main = async () => {
  const blockEngineUrl = process.env.BLOCK_ENGINE_URL || '';
  console.log('BLOCK_ENGINE_URL:', blockEngineUrl);

  const authKeypairPath = process.env.AUTH_KEYPAIR_PATH || '';
  console.log('AUTH_KEYPAIR_PATH:', authKeypairPath);
  const decodedKey = new Uint8Array(
    JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[]
  );
  const keypair = Keypair.fromSecretKey(decodedKey);

  const _accounts = (process.env.ACCOUNTS_OF_INTEREST || '').split(',');
  console.log('ACCOUNTS_OF_INTEREST:', _accounts);

  const bundleTransactionLimit = parseInt(
    process.env.BUNDLE_TRANSACTION_LIMIT || '0'
  );

  const c = searcherClient(blockEngineUrl, keypair);

  const rpcUrl = process.env.RPC_URL || '';
  console.log('RPC_URL:', rpcUrl);
  const conn = new Connection(rpcUrl, 'confirmed');

  // Send bundle (keeps existing leader check logic)
  const result = await sendBundles(c, bundleTransactionLimit, keypair, conn);
  if (!result.ok) {
    console.error('Failed to send bundles:', result.error);
    return;
  }
  console.log('Successfully sent bundles:', result.value);

  // Simple poll for results with timeout
  let finalResult: any = null; // Temporarily use any to avoid TS issues
  const timeout = 30000; // 30 seconds
  const pollInterval = 2000; // 2 seconds  
  const startTime = Date.now();
  
  console.log('Polling for bundle results...');
  
  const cancelStream = c.onBundleResult(
    (bundleResult) => {
      console.log('received bundle result:', bundleResult);
      // Simplify the conditional - just assign if any final state exists
      if (bundleResult.rejected || bundleResult.finalized || bundleResult.processed || bundleResult.dropped) {
        finalResult = bundleResult as BundleResult;
      }
    },
    (error) => {
      console.log('Stream error (ignoring):', error.message);
    }
  );

  // Poll until we get a final result or timeout
  while (!finalResult && (Date.now() - startTime) < timeout) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  // Cleanup
  cancelStream();

  if (finalResult) {
    let state = 'UNKNOWN';
    if (finalResult.rejected) state = 'REJECTED';
    else if (finalResult.finalized) state = 'FINALIZED';
    else if (finalResult.processed) state = 'PROCESSED';
    else if (finalResult.dropped) state = 'DROPPED';
    
    console.log(`Bundle reached final state: ${state}`);
  } else {
    console.log('Bundle result timeout - assuming processed');
  }

  console.log('Bundle processing complete');
};

main()
  .then(() => {
    console.log('Exiting gracefully');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });