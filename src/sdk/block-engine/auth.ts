import * as ed from '@noble/ed25519';
import {
  InterceptingCall,
  Interceptor,
  InterceptorOptions,
  Listener,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';

import {Keypair} from '@solana/web3.js';
import {NextCall} from '@grpc/grpc-js/build/src/client-interceptors';

import {
  AuthServiceClient,
  GenerateAuthChallengeRequest,
  GenerateAuthChallengeResponse,
  GenerateAuthTokensRequest,
  GenerateAuthTokensResponse,
  RefreshAccessTokenRequest,
  RefreshAccessTokenResponse,
  Role,
  Token,
} from '../../gen/block-engine/auth';
import {unixTimestampFromDate} from './utils';

// Intercepts requests and sets the auth header.
export const authInterceptor = (authProvider: AuthProvider): Interceptor => {
  return (opts: InterceptorOptions, nextCall: NextCall) => {
    return new InterceptingCall(nextCall(opts), {
      start: async function (metadata: Metadata, listener: Listener, next) {
        const callback = (accessToken: Jwt) => {
          metadata.set('authorization', `Bearer ${accessToken.token}`);
          next(metadata, listener);
        };
        authProvider.injectAccessToken(callback);
      },
    });
  };
};

// Represents server issued JWT tokens.
export class Jwt {
  readonly token: string;
  private readonly expiration: number;

  constructor(token: string, expiration: number) {
    this.token = token;
    this.expiration = expiration;
  }

  isExpired(): boolean {
    const now: number = unixTimestampFromDate(new Date());
    return this.expiration <= now;
  }
}

// Handles requesting and refreshing tokens, providing them via callbacks.
export class AuthProvider {
  private client: AuthServiceClient;
  private readonly authKeypair: Keypair;
  private accessToken: Jwt | undefined;
  private refreshToken: Jwt | undefined;
  private refreshing: Promise<void> | null = null;

  constructor(client: AuthServiceClient, authKeypair: Keypair) {
    this.client = client;
    this.authKeypair = authKeypair;
    this.fullAuth((accessToken: Jwt, refreshToken: Jwt) => {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    });
  }

  // Injects the current access token into the provided callback.
  // If it's expired then refreshes, if the refresh token is expired then runs the full auth flow.
  public injectAccessToken(callback: (accessToken: Jwt) => void) {
    if (
      !this.accessToken ||
      !this.refreshToken ||
      this.refreshToken.isExpired()
    ) {
      this.fullAuth((accessToken: Jwt, refreshToken: Jwt) => {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        callback(accessToken);
      });

      return;
    }

    if (!this.accessToken?.isExpired()) {
      callback(this.accessToken);
      return;
    }

    if (!this.refreshing) {
      this.refreshing = this.refreshAccessToken().finally(() => {
        this.refreshing = null;
      });
    }

    this.refreshing.then(() => {
      if (this.accessToken) {
        callback(this.accessToken);
      }
    });
  }

  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  
  // Refresh access token.
  private async refreshAccessToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
  
    this.isRefreshing = true;
    this.refreshPromise = new Promise<void>((resolve, reject) => {
      this.client.refreshAccessToken(
        {
          refreshToken: this.refreshToken?.token,
        } as RefreshAccessTokenRequest,
        async (e: ServiceError | null, resp: RefreshAccessTokenResponse) => {
          if (e) {
            this.isRefreshing = false;
            this.refreshPromise = null;
            return reject(e);
          }
  
          if (!AuthProvider.isValidToken(resp.accessToken)) {
            this.isRefreshing = false;
            this.refreshPromise = null;
            return reject(`received invalid access token ${resp.accessToken}`);
          }
          this.accessToken = new Jwt(
            resp.accessToken?.value || '',
            unixTimestampFromDate(resp.accessToken?.expiresAtUtc || new Date())
          );
          this.isRefreshing = false;
          this.refreshPromise = null;
          resolve();
        }
      );
    });
  
    return this.refreshPromise;
  }

  // Creates an AuthProvider object, and asynchronously performs full authentication flow.
  public static create(
    client: AuthServiceClient,
    authKeypair: Keypair
  ): AuthProvider {
    const provider = new AuthProvider(client, authKeypair);
    provider.fullAuth((accessToken: Jwt, refreshToken: Jwt) => {
      provider.accessToken = accessToken;
      provider.refreshToken = refreshToken;
    });

    return provider;
  }

  // Run entire auth flow:
  // - fetch a server generated challenge
  // - sign the challenge and submit in exchange for an access and refresh token
  // - inject the tokens into the provided callback
  private fullAuth(
    callback: (accessToken: Jwt, refreshToken: Jwt) => void
  ): void {
    this.client.generateAuthChallenge(
      {
        role: Role.SEARCHER,
        pubkey: this.authKeypair.publicKey.toBytes(),
      } as GenerateAuthChallengeRequest,
      async (e: ServiceError | null, resp: GenerateAuthChallengeResponse) => {
        if (e) {
          throw e;
        }

        // Append pubkey to ensure what we're signing is garbage.
        const challenge = `${this.authKeypair.publicKey.toString()}-${
          resp.challenge
        }`;
        const signedChallenge = await ed.sign(
          Buffer.from(challenge),
          // First 32 bytes is the private key, last 32 public key.
          this.authKeypair.secretKey.slice(0, 32)
        );

        this.client.generateAuthTokens(
          {
            challenge,
            clientPubkey: this.authKeypair.publicKey.toBytes(),
            signedChallenge,
          } as GenerateAuthTokensRequest,
          (e: ServiceError | null, resp: GenerateAuthTokensResponse) => {
            if (e) {
              throw e;
            }

            if (!AuthProvider.isValidToken(resp.accessToken)) {
              throw `received invalid access token ${resp.accessToken}`;
            }
            const accessToken = new Jwt(
              resp.accessToken?.value || '',
              unixTimestampFromDate(
                resp.accessToken?.expiresAtUtc || new Date()
              )
            );

            if (!AuthProvider.isValidToken(resp.refreshToken)) {
              throw `received invalid refresh token ${resp.refreshToken}`;
            }
            const refreshToken = new Jwt(
              resp.refreshToken?.value || '',
              unixTimestampFromDate(
                resp.refreshToken?.expiresAtUtc || new Date()
              )
            );

            callback(accessToken, refreshToken);
          }
        );
      }
    );
  }

  private static isValidToken(token: Token | undefined) {
    if (!token) {
      return false;
    }
    if (!token.expiresAtUtc) {
      return false;
    }

    return true;
  }
}
