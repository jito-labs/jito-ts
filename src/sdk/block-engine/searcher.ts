import {Keypair} from '@solana/web3.js';
import {
  ChannelCredentials,
  ChannelOptions,
  ClientReadableStream,
  ServiceError,
  status,
} from '@grpc/grpc-js';

import {AuthServiceClient} from '../../gen/block-engine/auth';
import {BundleResult} from '../../gen/block-engine/bundle';
import {
  ConnectedLeadersResponse,
  GetTipAccountsResponse,
  NextScheduledLeaderResponse,
  SearcherServiceClient,
  SendBundleRequest,
  SendBundleResponse,
  SlotList,
} from '../../gen/block-engine/searcher';
import {authInterceptor, AuthProvider} from './auth';
import {Bundle} from './types';
import {Result, Ok, Err} from './utils';

export class SearcherClientError extends Error {
  constructor(public code: status, message: string, public details: string) {
    super(`${message}${details ? `: ${details}` : ''}`);
    this.name = 'SearcherClientError';
  }
}

export class SearcherClient {
  private client: SearcherServiceClient;
  private readonly retryOptions: Readonly<{
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    factor: number;
  }>;
  private _activeBundleResultStream: ClientReadableStream<BundleResult> | null =
    null;

  constructor(client: SearcherServiceClient) {
    this.client = client;
    this.retryOptions = Object.freeze({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      factor: 2,
    });
  }

  private handleError(e: ServiceError): SearcherClientError {
    const errorDetails = e.details || 'No additional details provided';
    
    switch (e.code) {
      case status.OK:
        return new SearcherClientError(e.code, 'Unexpected OK status in error', errorDetails);
      case status.CANCELLED:
        return new SearcherClientError(e.code, 'The operation was cancelled', errorDetails);
      case status.UNKNOWN:
        return new SearcherClientError(e.code, 'Unknown error', errorDetails);
      case status.INVALID_ARGUMENT:
        return new SearcherClientError(e.code, 'Invalid argument provided', errorDetails);
      case status.DEADLINE_EXCEEDED:
        return new SearcherClientError(e.code, 'Deadline exceeded', errorDetails);
      case status.NOT_FOUND:
        return new SearcherClientError(e.code, 'Requested entity not found', errorDetails);
      case status.ALREADY_EXISTS:
        return new SearcherClientError(e.code, 'The entity already exists', errorDetails);
      case status.PERMISSION_DENIED:
        return new SearcherClientError(e.code, 'Lacking required permission', errorDetails);
      case status.RESOURCE_EXHAUSTED:
        return new SearcherClientError(e.code, 'Resource has been exhausted', errorDetails);
      case status.FAILED_PRECONDITION:
        return new SearcherClientError(e.code, 'Operation rejected, system not in correct state', errorDetails);
      case status.ABORTED:
        return new SearcherClientError(e.code, 'The operation was aborted', errorDetails);
      case status.OUT_OF_RANGE:
        return new SearcherClientError(e.code, 'Operation attempted past the valid range', errorDetails);
      case status.UNIMPLEMENTED:
        return new SearcherClientError(e.code, 'Operation not implemented or supported', errorDetails);
      case status.INTERNAL:
        return new SearcherClientError(e.code, 'Internal error', errorDetails);
      case status.UNAVAILABLE:
        let unavailableMessage = 'The service is currently unavailable';
        if (errorDetails.includes('upstream connect error or disconnect/reset before headers')) {
          unavailableMessage = 'Service unavailable: Envoy overloaded';
        } else if (errorDetails.toLowerCase().includes('dns resolution failed')) {
          unavailableMessage = 'Service unavailable: DNS resolution failed';
        } else if (errorDetails.toLowerCase().includes('ssl handshake failed')) {
          unavailableMessage = 'Service unavailable: SSL handshake failed';
        } else if (errorDetails.toLowerCase().includes('connection refused')) {
          unavailableMessage = 'Service unavailable: Connection refused';
        } else if (errorDetails.toLowerCase().includes('network unreachable')) {
          unavailableMessage = 'Service unavailable: Network is unreachable';
        } else if (errorDetails.toLowerCase().includes('timeout')) {
          unavailableMessage = 'Service unavailable: Connection timed out';
        }
        return new SearcherClientError(e.code, unavailableMessage, errorDetails);
      case status.DATA_LOSS:
        return new SearcherClientError(e.code, 'Unrecoverable data loss or corruption', errorDetails);
      case status.UNAUTHENTICATED:
        return new SearcherClientError(e.code, 'Request not authenticated', errorDetails);
      default:
        return new SearcherClientError(status.UNKNOWN, `Unexpected error: ${e.message}`, errorDetails);
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<Result<T, SearcherClientError>>,
    retries = 0
  ): Promise<Result<T, SearcherClientError>> {
    try {
      return await operation();
    } catch (error) {
      if (retries >= this.retryOptions.maxRetries || !this.isRetryableError(error)) {
        return Err(error as SearcherClientError);
      }

      const delay = Math.min(
        this.retryOptions.baseDelay * Math.pow(this.retryOptions.factor, retries),
        this.retryOptions.maxDelay
      );
      console.warn(`Operation failed. Retrying in ${delay}ms... (Attempt ${retries + 1} of ${this.retryOptions.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.retryWithBackoff(operation, retries + 1);
    }
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof SearcherClientError) {
      if (error.code === status.UNAVAILABLE) {
        const nonRetryableMessages = [
          'Service unavailable: DNS resolution failed',
          'Service unavailable: SSL handshake failed'
        ];
        return !nonRetryableMessages.some(msg => error.message.includes(msg));
      }
      const retryableCodes = [
        status.UNAVAILABLE,
        status.RESOURCE_EXHAUSTED,
        status.DEADLINE_EXCEEDED,
      ];
      return retryableCodes.includes(error.code);
    }
    return false;
  }

   /**
   * Submits a bundle to the block-engine.
   *
   * @param bundle - The Bundle object to be sent.
   * @returns A Promise that resolves to the bundle's UUID (string) on successful submission.
   * @throws A ServiceError if there's an issue with the server while sending the bundle.
   */
   async sendBundle(bundle: Bundle): Promise<Result<string, SearcherClientError>> {
    return this.retryWithBackoff(() => {
      return new Promise<Result<string, SearcherClientError>>((resolve) => {
        this.client.sendBundle(
          { bundle } as SendBundleRequest,
          (e: ServiceError | null, resp: SendBundleResponse) => {
            if (e) {
              resolve(Err(this.handleError(e)));
            } else {
              resolve(Ok(resp.uuid));
            }
          }
        );
      });
    });
  }

  /**
   * Retrieves tip accounts from the server.
   *
   * @returns A Promise that resolves to an array of account strings (usually public keys).
   * @throws A ServiceError if there's an issue with the server while fetching tip accounts.
   */
  async getTipAccounts(): Promise<Result<string[], SearcherClientError>> {
    return this.retryWithBackoff(() => {
      return new Promise<Result<string[], SearcherClientError>>((resolve) => {
        this.client.getTipAccounts(
          {},
          (e: ServiceError | null, resp: GetTipAccountsResponse) => {
            if (e) {
              resolve(Err(this.handleError(e)));
            } else {
              resolve(Ok(resp.accounts));
            }
          }
        );
      });
    });
  }

   /**
   * Retrieves connected leaders (validators) from the server.
   *
   * @returns A Promise that resolves to a map, where keys are validator identity keys (usually public keys), and values are SlotList objects.
   * @throws A ServiceError if there's an issue with the server while fetching connected leaders.
   */
  async getConnectedLeaders(): Promise<Result<{[key: string]: SlotList}, SearcherClientError>> {
    return this.retryWithBackoff(() => {
      return new Promise<Result<{[key: string]: SlotList}, SearcherClientError>>((resolve) => {
        this.client.getConnectedLeaders(
          {},
          async (e: ServiceError | null, resp: ConnectedLeadersResponse) => {
            if (e) {
              resolve(Err(this.handleError(e)));
            } else {
              resolve(Ok(resp.connectedValidators));
            }
          }
        );
      });
    });
  }

  /**
   * Returns the next scheduled leader connected to the block-engine.
   *
   * @returns A Promise that resolves with an object containing:
   *        - currentSlot: The current slot number the backend is on
   *        - nextLeaderSlot: The slot number of the next scheduled leader
   *        - nextLeaderIdentity: The identity of the next scheduled leader
   * @throws A ServiceError if there's an issue with the server while fetching the next scheduled leader.
   */
  async getNextScheduledLeader(): Promise<Result<{
    currentSlot: number;
    nextLeaderSlot: number;
    nextLeaderIdentity: string;
  }, SearcherClientError>> {
    return this.retryWithBackoff(() => {
      return new Promise<Result<{
        currentSlot: number;
        nextLeaderSlot: number;
        nextLeaderIdentity: string;
      }, SearcherClientError>>((resolve) => {
        this.client.getNextScheduledLeader(
          {
            regions: [],
          },
          async (e: ServiceError | null, resp: NextScheduledLeaderResponse) => {
            if (e) {
              resolve(Err(this.handleError(e)));
            } else {
              resolve(Ok(resp));
            }
          }
        );
      });
    });
  }

/**
   * Checks if a gRPC error represents normal stream closure
   */
  private isNormalStreamClosure(error: any): boolean {
    const message = error.message || '';
    const code = error.code;
    
    // gRPC status code 13 = INTERNAL, often used for RST_STREAM
    if (code === 13 && (
      message.includes('RST_STREAM') ||
      message.includes('Call ended without gRPC status')
    )) {
      return true;
    }
    
    // Other normal closure patterns
    return message.includes('stream ended') || 
           message.includes('connection closed');
  }

  /**
   * Triggers the provided callback on BundleResult updates.
   *
   * Automatically cancels any previously active bundle result stream to
   * prevent connection leaks that cause RESOURCE_EXHAUSTED errors.
   *
   * @param successCallback - A callback function that receives the BundleResult updates
   * @param errorCallback - A callback function that receives actual stream errors (not normal closure)
   * @returns A function to cancel the subscription
   */
  onBundleResult(
    successCallback: (bundleResult: BundleResult) => void,
    errorCallback: (e: Error) => void
  ): () => void {
    // Cancel any existing stream to prevent connection leak (fixes #54)
    this.close();

    const stream: ClientReadableStream<BundleResult> =
      this.client.subscribeBundleResults({});
    this._activeBundleResultStream = stream;

    stream.on('readable', () => {
      const msg = stream.read(1);
      if (msg) {
        successCallback(msg);
      }
    });

    stream.on('error', e => {
      this._activeBundleResultStream = null;

      // Filter out normal stream closure events
      if (this.isNormalStreamClosure(e)) {
        console.debug('Bundle result stream closed normally');
        return;
      }

      errorCallback(new Error(`Stream error: ${e.message}`));
    });

    stream.on('end', () => {
      this._activeBundleResultStream = null;
      console.debug('Bundle result stream ended');
    });

    return () => {
      try {
        stream.cancel();
      } catch {
        // Stream may already be closed
      }
      if (this._activeBundleResultStream === stream) {
        this._activeBundleResultStream = null;
      }
    };
  }

  /**
   * Closes any active bundle result stream and releases the connection.
   *
   * Call this before destroying the client, or when you no longer need
   * bundle result updates. Prevents RESOURCE_EXHAUSTED errors caused by
   * leaked gRPC streams.
   */
  close(): void {
    if (this._activeBundleResultStream) {
      try {
        this._activeBundleResultStream.cancel();
      } catch {
        // Stream may already be closed
      }
      this._activeBundleResultStream = null;
    }
  }

  /**
   * Yields on bundle results.
   *
   * Automatically cancels any previously active bundle result stream.
   * Retries with exponential backoff on RESOURCE_EXHAUSTED errors.
   *
   * @param onError - A callback function that receives the stream error (Error)
   * @returns An async generator that yields BundleResult updates
   */
  async *bundleResults(
    onError: (e: Error) => void
  ): AsyncGenerator<BundleResult> {
    // Cancel any existing stream (fixes #54)
    this.close();

    let retries = 0;
    const {maxRetries, baseDelay, maxDelay, factor} = this.retryOptions;

    while (retries <= maxRetries) {
      const stream: ClientReadableStream<BundleResult> =
        this.client.subscribeBundleResults({});
      this._activeBundleResultStream = stream;

      try {
        for await (const bundleResult of stream) {
          retries = 0; // Reset on successful result
          yield bundleResult;
        }

        // Stream ended cleanly
        break;
      } catch (e: any) {
        this._activeBundleResultStream = null;

        // Retry on RESOURCE_EXHAUSTED with backoff
        if (e?.code === status.RESOURCE_EXHAUSTED && retries < maxRetries) {
          retries++;
          const delay = Math.min(
            baseDelay * Math.pow(factor, retries - 1),
            maxDelay
          );
          console.warn(
            `RESOURCE_EXHAUSTED on bundle result stream. ` +
              `Retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
          );
          onError(
            new Error(
              `RESOURCE_EXHAUSTED: too many concurrent connections. ` +
                `Retrying in ${delay}ms (attempt ${retries}/${maxRetries})`
            )
          );
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        // Non-retryable error
        onError(e);
        throw e;
      }
    }

    this._activeBundleResultStream = null;
  }
}

/**
 * Creates and returns a SearcherClient instance.
 *
 * @param url - The URL of the SearcherService
 * @param authKeypair - Optional Keypair authorized for the block engine
 * @param grpcOptions - Optional configuration options for the gRPC client
 * @returns SearcherClient - An instance of the SearcherClient
 */
export const searcherClient = (
  url: string,
  authKeypair?: Keypair,
  grpcOptions?: Partial<ChannelOptions>
): SearcherClient => {
  if (authKeypair) {
    const authProvider = new AuthProvider(
      new AuthServiceClient(url, ChannelCredentials.createSsl()),
      authKeypair
    );
    const client = new SearcherServiceClient(
      url,
      ChannelCredentials.createSsl(),
      {interceptors: [authInterceptor(authProvider)], ...grpcOptions}
    );
    return new SearcherClient(client);
  } else {
    return new SearcherClient(
      new SearcherServiceClient(
        url,
        ChannelCredentials.createSsl(),
        grpcOptions
      )
    );
  }
};