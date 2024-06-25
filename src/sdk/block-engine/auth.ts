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
        const accessToken = await authProvider
            .getAccessToken()
            .then(token => token.token)
            .catch(() => '');
        metadata.set('authorization', `Bearer ${accessToken}`);
        next(metadata, listener);
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

  constructor(client: AuthServiceClient, authKeypair: Keypair) {
    this.client = client;
    this.authKeypair = authKeypair;
  }

  // Returns the current access token.
  // If it's expired then refreshes, if the refresh token is expired then runs the full auth flow.
  public async getAccessToken(): Promise<Jwt> {
    if (
        !this.accessToken ||
        !this.refreshToken ||
        this.refreshToken.isExpired()
    ) {
      const {accessToken, refreshToken} = await this.fullAuth();
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      return accessToken;
    }

    if (!this.accessToken?.isExpired()) {
      return this.accessToken;
    }

    const accessToken = await this.refreshAccessToken();
    this.accessToken = accessToken;
    return accessToken;
  }

  // Refresh access token and return it.
  private async refreshAccessToken(): Promise<Jwt> {
    const refreshAccessTokenResponse =
        await new Promise<RefreshAccessTokenResponse>((resolve, reject) => {
          this.client.refreshAccessToken(
              {
                refreshToken: this.refreshToken?.token,
              } as RefreshAccessTokenRequest,
              async (e: ServiceError | null, resp: RefreshAccessTokenResponse) => {
                if (e) {
                  reject(e);
                } else {
                  resolve(resp);
                }
              }
          );
        });

    if (!AuthProvider.isValidToken(refreshAccessTokenResponse.accessToken)) {
      throw `received invalid access token ${refreshAccessTokenResponse.accessToken}`;
    }

    const accessToken = new Jwt(
        refreshAccessTokenResponse.accessToken?.value || '',
        unixTimestampFromDate(
            refreshAccessTokenResponse.accessToken?.expiresAtUtc || new Date()
        )
    );

    return accessToken;
  }

  // Creates an AuthService object, and asynchronously performs full authentication flow.
  public static async create(
      client: AuthServiceClient,
      authKeypair: Keypair
  ): Promise<AuthProvider> {
    const provider = new AuthProvider(client, authKeypair);

    const {accessToken, refreshToken} = await provider.fullAuth();

    provider.accessToken = accessToken;
    provider.refreshToken = refreshToken;

    return provider;
  }

  // Run entire auth flow:
  // - fetch a server generated challenge
  // - sign the challenge and submit in exchange for an access and refresh token
  // - returns the tokens
  private async fullAuth(): Promise<{
    accessToken: Jwt;
    refreshToken: Jwt;
  }> {
    const authChallengeResponse =
        await new Promise<GenerateAuthChallengeResponse>((resolve, reject) => {
          this.client.generateAuthChallenge(
              {
                role: Role.SEARCHER,
                pubkey: this.authKeypair.publicKey.toBytes(),
              } as GenerateAuthChallengeRequest,
              (e: ServiceError | null, resp: GenerateAuthChallengeResponse) => {
                if (e) {
                  reject(e);
                } else {
                  resolve(resp);
                }
              }
          );
        });

    // Append pubkey to ensure what we're signing is garbage.
    const challenge = `${this.authKeypair.publicKey.toString()}-${
        authChallengeResponse.challenge
    }`;

    const signedChallenge = await ed.sign(
        Buffer.from(challenge),
        // First 32 bytes is the private key, last 32 public key.
        this.authKeypair.secretKey.slice(0, 32)
    );

    const authTokensResponse = await new Promise<GenerateAuthTokensResponse>(
        (resolve, reject) => {
          this.client.generateAuthTokens(
              {
                challenge,
                clientPubkey: this.authKeypair.publicKey.toBytes(),
                signedChallenge,
              } as GenerateAuthTokensRequest,
              (e: ServiceError | null, resp: GenerateAuthTokensResponse) => {
                if (e) {
                  reject(e);
                } else {
                  resolve(resp);
                }
              }
          );
        }
    );

    if (!AuthProvider.isValidToken(authTokensResponse.accessToken)) {
      throw `received invalid access token ${authTokensResponse.accessToken}`;
    }

    const accessToken = new Jwt(
        authTokensResponse.accessToken?.value || '',
        unixTimestampFromDate(
            authTokensResponse.accessToken?.expiresAtUtc || new Date()
        )
    );

    if (!AuthProvider.isValidToken(authTokensResponse.refreshToken)) {
      throw `received invalid refresh token ${authTokensResponse.refreshToken}`;
    }
    const refreshToken = new Jwt(
        authTokensResponse.refreshToken?.value || '',
        unixTimestampFromDate(
            authTokensResponse.refreshToken?.expiresAtUtc || new Date()
        )
    );

    return {
      accessToken,
      refreshToken,
    };
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
