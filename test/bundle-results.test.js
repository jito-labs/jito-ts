const assert = require('node:assert/strict');
const {test} = require('node:test');
const {
  Server,
  ServerCredentials,
  ChannelCredentials,
  status,
} = require('@grpc/grpc-js');
const {
  SearcherServiceService,
  SearcherServiceClient,
} = require('../dist/gen/block-engine/searcher');
const {SearcherClient} = require('../dist/sdk/block-engine/searcher');

async function service(t, subscribeBundleResults) {
  const server = new Server();
  server.addService(SearcherServiceService, {subscribeBundleResults});
  const port = await new Promise((resolve, reject) => {
    server.bindAsync(
      '127.0.0.1:0',
      ServerCredentials.createInsecure(),
      (error, port) => (error ? reject(error) : resolve(port))
    );
  });
  const transport = new SearcherServiceClient(
    `127.0.0.1:${port}`,
    ChannelCredentials.createInsecure()
  );
  t.after(() => {
    transport.close();
    server.forceShutdown();
  });
  return new SearcherClient(transport);
}

function cancellation(call) {
  return new Promise(resolve => call.once('cancelled', resolve));
}

async function assertCancelled(cancelled) {
  let timer;
  try {
    await Promise.race([
      cancelled,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('gRPC call was not cancelled')),
          1000
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

for (const exit of ['break', 'return', 'throw']) {
  test(`cancels the remote gRPC subscription on consumer ${exit}`, async t => {
    let cancelled;
    const client = await service(t, call => {
      cancelled = cancellation(call);
      call.write({bundleId: 'first'});
      // Keep the RPC open, just as the block engine does for subscriptions.
    });
    const results = client.bundleResults(() => {});
    if (exit === 'break') {
      for await (const result of results) {
        assert.equal(result.bundleId, 'first');
        break;
      }
    } else {
      assert.equal((await results.next()).value.bundleId, 'first');
      if (exit === 'return') {
        await results.return();
      } else {
        const error = new Error('consumer stopped');
        await assert.rejects(results.throw(error), error);
      }
    }
    await assertCancelled(cancelled);
  });
}

test('yields every result until the server finishes normally', async t => {
  const count = 256;
  const client = await service(t, call => {
    for (let i = 0; i < count; i++) call.write({bundleId: String(i)});
    call.end();
  });
  const errors = [];
  const received = [];
  for await (const result of client.bundleResults(error =>
    errors.push(error)
  )) {
    received.push(result.bundleId);
  }
  assert.deepEqual(
    received,
    Array.from({length: count}, (_, i) => String(i))
  );
  assert.deepEqual(errors, []);
});

test('still forwards server errors to the callback and iterator', async t => {
  const client = await service(t, call => {
    call.emit('error', {
      code: status.UNAVAILABLE,
      details: 'test service unavailable',
    });
  });
  const errors = [];
  const results = client.bundleResults(error => errors.push(error));
  await assert.rejects(results.next(), {code: status.UNAVAILABLE});
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, status.UNAVAILABLE);
});
