const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {test} = require('node:test');
const {
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} = require('@solana/web3.js');
const {JitoRpcConnection} = require('../dist/sdk/rpc/connection');

function transaction() {
  const signer = Keypair.generate();
  const message = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: signer.publicKey.toBase58(),
    instructions: [],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign([signer]);
  return tx;
}

async function rpc(t) {
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const request = JSON.parse(body);
    requests.push(request);
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          context: {slot: 123},
          value: {
            summary: 'succeeded',
            transactionResults: request.params[0].encodedTransactions.map(
              () => ({
                err: null,
                logs: [],
                unitsConsumed: 1,
              })
            ),
          },
        },
      })
    );
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const connection = new JitoRpcConnection(
    `http://127.0.0.1:${server.address().port}`,
    {httpAgent: false}
  );
  return {connection, requests};
}

function config(simulationBank) {
  return {
    preExecutionAccountsConfigs: [null],
    postExecutionAccountsConfigs: [null],
    simulationBank,
  };
}

test('omitted config supplies one pre/post entry for every transaction', async t => {
  const {connection, requests} = await rpc(t);
  const bundle = [transaction(), transaction()];
  const result = await connection.simulateBundle(bundle);
  assert.equal(result.value.summary, 'succeeded');
  assert.equal(requests[0].method, 'simulateBundle');
  assert.deepEqual(requests[0].params, [
    {
      encodedTransactions: bundle.map(tx =>
        Buffer.from(tx.serialize()).toString('base64')
      ),
    },
    {
      preExecutionAccountsConfigs: [null, null],
      postExecutionAccountsConfigs: [null, null],
      transactionEncoding: 'base64',
    },
  ]);
});

// The server uses externally tagged SimulationSlotConfig variants, with a nested
// CommitmentConfig, rather than the SDK's convenient scalar input type:
// https://github.com/jito-foundation/jito-solana/blob/cf3c278bfa07ca2e57cdcf18aae4093fadce4cbc/rpc-client-api/src/bundles.rs
for (const bank of ['processed', 'confirmed', 'finalized', 'tip', 0, 123]) {
  test(`encodes simulation bank ${bank} for the RPC`, async t => {
    const {connection, requests} = await rpc(t);
    await connection.simulateBundle([transaction()], config(bank));
    const expected =
      typeof bank === 'number'
        ? {slot: bank}
        : bank === 'tip'
        ? 'tip'
        : {commitment: {commitment: bank}};
    assert.deepEqual(requests[0].params[1].simulationBank, expected);
  });
}

test('preserves account requests and options without mutating frozen input', async t => {
  const {connection, requests} = await rpc(t);
  const input = Object.freeze({
    ...config('confirmed'),
    preExecutionAccountsConfigs: [
      {
        encoding: 'base64',
        addresses: [Keypair.generate().publicKey.toBase58()],
      },
    ],
    skipSigVerify: false,
    replaceRecentBlockhash: true,
  });
  const before = JSON.stringify(input);
  await connection.simulateBundle([transaction()], input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(requests[0].params[1], {
    ...input,
    simulationBank: {commitment: {commitment: 'confirmed'}},
    transactionEncoding: 'base64',
  });
});

for (const [legacy, commitment] of [
  ['recent', 'processed'],
  ['single', 'confirmed'],
  ['singleGossip', 'confirmed'],
  ['root', 'finalized'],
  ['max', 'finalized'],
]) {
  test(`normalizes deprecated commitment ${legacy} to ${commitment}`, async t => {
    const {connection, requests} = await rpc(t);
    await connection.simulateBundle([transaction()], config(legacy));
    assert.deepEqual(requests[0].params[1].simulationBank, {
      commitment: {commitment},
    });
  });
}

for (const [preLength, postLength] of [
  [0, 1],
  [1, 0],
  [0, 0],
  [2, 1],
  [1, 2],
]) {
  test(`rejects mismatched pre/post lengths ${preLength}/${postLength} before RPC`, async t => {
    const {connection, requests} = await rpc(t);
    await assert.rejects(
      connection.simulateBundle([transaction()], {
        preExecutionAccountsConfigs: Array(preLength).fill(null),
        postExecutionAccountsConfigs: Array(postLength).fill(null),
      }),
      /pre\/post execution account config length must match bundle length/
    );
    assert.equal(requests.length, 0);
  });
}
