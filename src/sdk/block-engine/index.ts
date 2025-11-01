export { SearcherClient, SearcherClientError } from './searcher';
export { AuthProvider as BlockEngineAuthProvider, Jwt, authInterceptor, AuthRefreshError } from './auth';
export { Bundle } from './types';
export * from './utils';

export {
  Role,
  GenerateAuthChallengeRequest,
  GenerateAuthChallengeResponse,
  GenerateAuthTokensRequest,
  GenerateAuthTokensResponse,
  RefreshAccessTokenRequest,
  RefreshAccessTokenResponse,
  Token,
} from '../../gen/block-engine/auth';

export {
  BundleUuid,
  BundleResult,
  Accepted,
  Rejected,
  Finalized,
  Processed,
  Dropped,
  DroppedReason,
  StateAuctionBidRejected,
  WinningBatchBidRejected,
  SimulationFailure,
  InternalError,
  DroppedBundle,
} from '../../gen/block-engine/bundle';

export {
  SendBundleRequest,
  SendBundleResponse,
  NextScheduledLeaderRequest,
  NextScheduledLeaderResponse,
  ConnectedLeadersRequest,
  ConnectedLeadersResponse,
  ConnectedLeadersRegionedRequest,
  ConnectedLeadersRegionedResponse,
  GetTipAccountsRequest,
  GetTipAccountsResponse,
  SubscribeBundleResultsRequest,
  GetRegionsRequest,
  GetRegionsResponse,
  SlotList,
} from '../../gen/block-engine/searcher';

export {
  Header,
  Heartbeat,
  Socket,
} from '../../gen/block-engine/shared';

export {
  Packet,
  PacketBatch,
  Meta,
  PacketFlags,
} from '../../gen/block-engine/packet';

export { AuthServiceClient } from '../../gen/block-engine/auth';
export { SearcherServiceClient } from '../../gen/block-engine/searcher';

// Dont break old namespace exports
export * as bundle from './types';
export * as searcher from './searcher';