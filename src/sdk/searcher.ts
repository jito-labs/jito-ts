import {Keypair, Transaction} from '@solana/web3.js';
import {
  ChannelCredentials,
  ClientReadableStream,
  ServiceError,
} from '@grpc/grpc-js';

import {AuthServiceClient} from '../gen/auth';
import {
  ConnectedLeadersResponse,
  GetTipAccountsResponse,
  NextScheduledLeaderResponse,
  PendingTxNotification,
  PendingTxSubscriptionRequest,
  SearcherServiceClient,
  SendBundleRequest,
  SendBundleResponse,
  SlotList,
} from '../gen/searcher';
import {authInterceptor, AuthProvider} from './auth';
import {Bundle} from './types';
import {deserializeTransactions} from './utils';
import {BundleResult} from '../gen/bundle';

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

  async getTipAccounts(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.getTipAccounts(
        {},
        async (e: ServiceError | null, resp: GetTipAccountsResponse) => {
          if (e) {
            reject(e);
          } else {
            resolve(resp.accounts);
          }
        }
      );
    });
  }

  // Returns a map of validator identity keys to their respective slot lists.
  // These are validators connected to the block-engine.
  async getConnectedLeaders(): Promise<{[key: string]: SlotList}> {
    return new Promise((resolve, reject) => {
      this.client.getConnectedLeaders(
        {},
        async (e: ServiceError | null, resp: ConnectedLeadersResponse) => {
          if (e) {
            reject(e);
          } else {
            resolve(resp.connectedValidators);
          }
        }
      );
    });
  }

  // Returns the next scheduled leader connected to the block-engine.
  async getNextScheduledLeader(): Promise<{
    /** the current slot the backend is on */
    currentSlot: number;
    /** the slot and identity of the next leader */
    nextLeaderSlot: number;
    nextLeaderIdentity: string;
  }> {
    return new Promise((resolve, reject) => {
      this.client.getNextScheduledLeader(
        {},
        async (e: ServiceError | null, resp: NextScheduledLeaderResponse) => {
          if (e) {
            reject(e);
          } else {
            resolve(resp);
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

  // Subscribes to bundle results.
  onBundleResult(
    successCallback: (bundleResult: BundleResult) => void,
    errorCallback: (e: Error) => void
  ) {
    const stream: ClientReadableStream<BundleResult> =
      this.client.subscribeBundleResults({});

    stream.on('readable', () => {
      successCallback(stream.read(1));
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
