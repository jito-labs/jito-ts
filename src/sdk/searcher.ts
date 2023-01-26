import {Keypair, Transaction} from '@solana/web3.js';
import {
  ChannelCredentials,
  ClientReadableStream,
  ServiceError,
} from '@grpc/grpc-js';

import {AuthServiceClient} from '../gen/auth';
import {
  PendingTxNotification,
  PendingTxSubscriptionRequest,
  SearcherServiceClient,
  SendBundleRequest,
  SendBundleResponse,
} from '../gen/searcher';
import {authInterceptor, AuthProvider} from './auth';
import {Bundle} from './types';
import {deserializeTransactions} from "./utils";

export class SearcherClient {
  private client: SearcherServiceClient;

  constructor(client: SearcherServiceClient) {
    this.client = client;
  }

  // Submits a bundle to the block-engine.
  // Returns a promise yielding the bundle's uuid.
  async sendBundle(bundle: Bundle): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.sendBundle(
        {
          bundle,
        } as SendBundleRequest,
        async (e: ServiceError | null, resp: SendBundleResponse) => {
          if (e) {
            reject(e);
          } else {
            resolve(resp.uuid);
          }
        }
      );
    });
  }

  // Accepts a list of accounts and filters transactions that write lock any of the accounts.
  onPendingTransactions(
    accounts: string[],
    successCallback: (transactions: Transaction[]) => void,
    errorCallback: (e: Error) => void
  ) {
    const stream: ClientReadableStream<PendingTxNotification> =
      this.client.subscribePendingTransactions({
        accounts,
      } as PendingTxSubscriptionRequest);

    stream.on('readable', () => {
      successCallback(deserializeTransactions(stream.read(1).transactions));
    });
    stream.on('error', () => errorCallback(new Error('Stream error')));
  }
}

export const searcherClient = (
  url: string,
  authKeypair: Keypair
): SearcherClient => {
  const authProvider = new AuthProvider(
    new AuthServiceClient(url, ChannelCredentials.createSsl()),
    authKeypair
  );
  const client = new SearcherServiceClient(
    url,
    ChannelCredentials.createSsl(),
    {interceptors: [authInterceptor(authProvider)]}
  );

  return new SearcherClient(client);
};
