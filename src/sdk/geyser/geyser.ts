import {
  ChannelCredentials,
  ClientReadableStream,
  ServiceError,
} from '@grpc/grpc-js';
import {PublicKey} from '@solana/web3.js';

import {authInterceptor} from './auth';
import {
  GetHeartbeatIntervalResponse,
  GeyserClient as GeyserClientStub,
  TimestampedAccountUpdate,
  TimestampedBlockUpdate,
} from '../../gen/geyser/geyser';

export class GeyserClient {
  private client: GeyserClientStub;

  constructor(client: GeyserClientStub) {
    this.client = client;
  }

  // Returns the cadence at which to expect the Geyser server to send heartbeats.
  async getHeartbeatIntervalMillis(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.getHeartbeatInterval(
        {},
        async (e: ServiceError | null, resp: GetHeartbeatIntervalResponse) => {
          if (e) {
            reject(e);
          } else {
            resolve(resp.heartbeatIntervalMs);
          }
        }
      );
    });
  }

  // Triggers the supplied callback on an update of the provided accounts of interest.
  onAccountUpdate(
    accountsOfInterest: PublicKey[],
    successCallback: (resp: TimestampedAccountUpdate) => void,
    errorCallback: (e: Error) => void
  ) {
    const accounts = accountsOfInterest.map(a => a.toBytes());
    const stream: ClientReadableStream<TimestampedAccountUpdate> =
      this.client.subscribeAccountUpdates({accounts});

    stream.on('readable', () => {
      successCallback(stream.read(1));
    });
    stream.on('error', e =>
      errorCallback(new Error(`Stream error: ${e.message}`))
    );
  }

  // Triggers the supplied callback on an account update owned by the provided programs of interest.
  onProgramUpdate(
    programsOfInterest: PublicKey[],
    successCallback: (resp: TimestampedAccountUpdate) => void,
    errorCallback: (e: Error) => void
  ) {
    const programs = programsOfInterest.map(a => a.toBytes());
    const stream: ClientReadableStream<TimestampedAccountUpdate> =
      this.client.subscribeProgramUpdates({programs});

    stream.on('readable', () => {
      successCallback(stream.read(1));
    });
    stream.on('error', e =>
      errorCallback(new Error(`Stream error: ${e.message}`))
    );
  }

  // Triggers the supplied callback for every processed block.
  onProcessedBlock(
    successCallback: (resp: TimestampedBlockUpdate) => void,
    errorCallback: (e: Error) => void
  ) {
    const stream: ClientReadableStream<TimestampedBlockUpdate> =
      this.client.subscribeBlockUpdates({});

    stream.on('readable', () => {
      successCallback(stream.read(1));
    });
    stream.on('error', e =>
      errorCallback(new Error(`Stream error: ${e.message}`))
    );
  }
}

export const geyserClient = (
  url: string,
  accessToken: string
): GeyserClient => {
  const client = new GeyserClientStub(url, ChannelCredentials.createSsl(), {
    interceptors: [authInterceptor(accessToken)],
  });

  return new GeyserClient(client);
};
