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

// Result type for token refresh operations
type RefreshResult = 
  | { success: true }
  | { success: false; reason: 'rate_limited'; retryAfter?: number }
  | { success: false; reason: 'auth_failed'; error: string }
  | { success: false; reason: 'invalid_response'; error: string }
  | { success: false; reason: 'network_error'; error: string };

// Export simplified error type for SDK users
export type AuthRefreshError = {
  reason: 'rate_limited' | 'auth_failed' | 'network_error' | 'invalid_response';
  message: string;
  retryAfter?: number;
};

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
  private refreshing: Promise<RefreshResult | null> | null = null;

  constructor(client: AuthServiceClient, authKeypair: Keypair) {
    this.client = client;
    this.authKeypair = authKeypair;
    this.fullAuth((accessToken: Jwt, refreshToken: Jwt) => {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    });
  }

  // If access token expired then refreshes, if the refresh token is expired then runs the full auth flow.
  public injectAccessToken(
    callback: (accessToken: Jwt) => void,
    errorCallback?: (error: AuthRefreshError) => void
  ) {
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

    this.refreshing.then((result) => {
      if (result?.success) {
        // Successful refresh - we have a valid access token
        callback(this.accessToken!);
      } else if (result && errorCallback) {
        // Refresh failed - let user decide what to do
        const authError: AuthRefreshError = {
          reason: result.reason,
          message: this.getErrorMessage(result),
          ...(result.reason === 'rate_limited' && result.retryAfter !== undefined && { retryAfter: result.retryAfter })
        };
        errorCallback(authError);
      } else if (result) {
        console.error(`Token refresh failed: ${result.reason} - ${this.getErrorMessage(result)}`);
      }
    }).catch((error) => {
      // This should never happen since refreshAccessToken never rejects now
      console.error('Unexpected error in token refresh flow:', error);
      if (errorCallback) {
        errorCallback({
          reason: 'network_error',
          message: 'Unexpected error in token refresh flow'
        });
      }
    });
  }

  // Helper method to safely get error message from RefreshResult
  private getErrorMessage(result: Exclude<RefreshResult, { success: true }>): string {
    switch (result.reason) {
      case 'rate_limited':
        return 'Request rate limited';
      case 'auth_failed':
      case 'invalid_response':
      case 'network_error':
        return result.error;
      default:
        return 'Token refresh failed';
    }
  }

  // Refresh access token with proper error reporting
  private async refreshAccessToken(): Promise<RefreshResult> {
    return new Promise<RefreshResult>((resolve) => {
      this.client.refreshAccessToken(
        {
          refreshToken: this.refreshToken?.token,
        } as RefreshAccessTokenRequest,
        async (e: ServiceError | null, resp: RefreshAccessTokenResponse) => {
          if (e) {
            // Handle different types of errors with specific reasons
            if (e.code === 8) { // RESOURCE_EXHAUSTED (gRPC equivalent of 429)
              resolve({ 
                success: false, 
                reason: 'rate_limited'
              });
              return;
            }
            
            if (e.code === 16) { // UNAUTHENTICATED
              resolve({ 
                success: false, 
                reason: 'auth_failed', 
                error: e.message 
              });
              return;
            }

            if (e.code === 14) { // UNAVAILABLE
              resolve({ 
                success: false, 
                reason: 'network_error', 
                error: e.message 
              });
              return;
            }

            // Default to auth failure for other error codes
            resolve({ 
              success: false, 
              reason: 'auth_failed', 
              error: e.message 
            });
            return;
          }
  
          if (!AuthProvider.isValidToken(resp.accessToken)) {
            resolve({ 
              success: false, 
              reason: 'invalid_response', 
              error: 'Received invalid access token from server' 
            });
            return;
          }
          
          this.accessToken = new Jwt(
            resp.accessToken?.value || '',
            unixTimestampFromDate(resp.accessToken?.expiresAtUtc || new Date())
          );
          
          resolve({ success: true });
        }
      );
    });
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