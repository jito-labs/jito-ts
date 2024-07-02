/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientOptions,
  ClientReadableStream,
  ClientUnaryCall,
  handleServerStreamingCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Bundle, BundleResult } from "./bundle";

export const protobufPackage = "searcher";

export interface SlotList {
  slots: number[];
}

export interface ConnectedLeadersResponse {
  /** Mapping of validator pubkey to leader slots for the current epoch. */
  connectedValidators: { [key: string]: SlotList };
}

export interface ConnectedLeadersResponse_ConnectedValidatorsEntry {
  key: string;
  value: SlotList | undefined;
}

export interface SendBundleRequest {
  bundle: Bundle | undefined;
}

export interface SendBundleResponse {
  /** server uuid for the bundle */
  uuid: string;
}

export interface NextScheduledLeaderRequest {
  /** Defaults to the currently connected region if no region provided. */
  regions: string[];
}

export interface NextScheduledLeaderResponse {
  /** the current slot the backend is on */
  currentSlot: number;
  /** the slot of the next leader */
  nextLeaderSlot: number;
  /** the identity pubkey (base58) of the next leader */
  nextLeaderIdentity: string;
  /** the block engine region of the next leader */
  nextLeaderRegion: string;
}

export interface ConnectedLeadersRequest {
}

export interface ConnectedLeadersRegionedRequest {
  /** Defaults to the currently connected region if no region provided. */
  regions: string[];
}

export interface ConnectedLeadersRegionedResponse {
  connectedValidators: { [key: string]: ConnectedLeadersResponse };
}

export interface ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
  key: string;
  value: ConnectedLeadersResponse | undefined;
}

export interface GetTipAccountsRequest {
}

export interface GetTipAccountsResponse {
  accounts: string[];
}

export interface SubscribeBundleResultsRequest {
}

export interface GetRegionsRequest {
}

export interface GetRegionsResponse {
  /** The region the client is currently connected to */
  currentRegion: string;
  /**
   * Regions that are online and ready for connections
   * All regions: https://jito-labs.gitbook.io/mev/systems/connecting/mainnet
   */
  availableRegions: string[];
}

function createBaseSlotList(): SlotList {
  return { slots: [] };
}

export const SlotList = {
  encode(message: SlotList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.slots) {
      writer.uint64(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SlotList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSlotList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if ((tag & 7) === 2) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.slots.push(longToNumber(reader.uint64() as Long));
            }
          } else {
            message.slots.push(longToNumber(reader.uint64() as Long));
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SlotList {
    return { slots: Array.isArray(object?.slots) ? object.slots.map((e: any) => Number(e)) : [] };
  },

  toJSON(message: SlotList): unknown {
    const obj: any = {};
    if (message.slots) {
      obj.slots = message.slots.map((e) => Math.round(e));
    } else {
      obj.slots = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SlotList>, I>>(base?: I): SlotList {
    return SlotList.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SlotList>, I>>(object: I): SlotList {
    const message = createBaseSlotList();
    message.slots = object.slots?.map((e) => e) || [];
    return message;
  },
};

function createBaseConnectedLeadersResponse(): ConnectedLeadersResponse {
  return { connectedValidators: {} };
}

export const ConnectedLeadersResponse = {
  encode(message: ConnectedLeadersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.connectedValidators).forEach(([key, value]) => {
      ConnectedLeadersResponse_ConnectedValidatorsEntry.encode({ key: key as any, value }, writer.uint32(10).fork())
        .ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          const entry1 = ConnectedLeadersResponse_ConnectedValidatorsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.connectedValidators[entry1.key] = entry1.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectedLeadersResponse {
    return {
      connectedValidators: isObject(object.connectedValidators)
        ? Object.entries(object.connectedValidators).reduce<{ [key: string]: SlotList }>((acc, [key, value]) => {
          acc[key] = SlotList.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: ConnectedLeadersResponse): unknown {
    const obj: any = {};
    obj.connectedValidators = {};
    if (message.connectedValidators) {
      Object.entries(message.connectedValidators).forEach(([k, v]) => {
        obj.connectedValidators[k] = SlotList.toJSON(v);
      });
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersResponse>, I>>(base?: I): ConnectedLeadersResponse {
    return ConnectedLeadersResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersResponse>, I>>(object: I): ConnectedLeadersResponse {
    const message = createBaseConnectedLeadersResponse();
    message.connectedValidators = Object.entries(object.connectedValidators ?? {}).reduce<{ [key: string]: SlotList }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = SlotList.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseConnectedLeadersResponse_ConnectedValidatorsEntry(): ConnectedLeadersResponse_ConnectedValidatorsEntry {
  return { key: "", value: undefined };
}

export const ConnectedLeadersResponse_ConnectedValidatorsEntry = {
  encode(
    message: ConnectedLeadersResponse_ConnectedValidatorsEntry,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SlotList.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersResponse_ConnectedValidatorsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersResponse_ConnectedValidatorsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SlotList.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectedLeadersResponse_ConnectedValidatorsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? SlotList.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ConnectedLeadersResponse_ConnectedValidatorsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value ? SlotList.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersResponse_ConnectedValidatorsEntry>, I>>(
    base?: I,
  ): ConnectedLeadersResponse_ConnectedValidatorsEntry {
    return ConnectedLeadersResponse_ConnectedValidatorsEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersResponse_ConnectedValidatorsEntry>, I>>(
    object: I,
  ): ConnectedLeadersResponse_ConnectedValidatorsEntry {
    const message = createBaseConnectedLeadersResponse_ConnectedValidatorsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? SlotList.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSendBundleRequest(): SendBundleRequest {
  return { bundle: undefined };
}

export const SendBundleRequest = {
  encode(message: SendBundleRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.bundle !== undefined) {
      Bundle.encode(message.bundle, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendBundleRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendBundleRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bundle = Bundle.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendBundleRequest {
    return { bundle: isSet(object.bundle) ? Bundle.fromJSON(object.bundle) : undefined };
  },

  toJSON(message: SendBundleRequest): unknown {
    const obj: any = {};
    message.bundle !== undefined && (obj.bundle = message.bundle ? Bundle.toJSON(message.bundle) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SendBundleRequest>, I>>(base?: I): SendBundleRequest {
    return SendBundleRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SendBundleRequest>, I>>(object: I): SendBundleRequest {
    const message = createBaseSendBundleRequest();
    message.bundle = (object.bundle !== undefined && object.bundle !== null)
      ? Bundle.fromPartial(object.bundle)
      : undefined;
    return message;
  },
};

function createBaseSendBundleResponse(): SendBundleResponse {
  return { uuid: "" };
}

export const SendBundleResponse = {
  encode(message: SendBundleResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.uuid !== "") {
      writer.uint32(10).string(message.uuid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendBundleResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendBundleResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.uuid = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SendBundleResponse {
    return { uuid: isSet(object.uuid) ? String(object.uuid) : "" };
  },

  toJSON(message: SendBundleResponse): unknown {
    const obj: any = {};
    message.uuid !== undefined && (obj.uuid = message.uuid);
    return obj;
  },

  create<I extends Exact<DeepPartial<SendBundleResponse>, I>>(base?: I): SendBundleResponse {
    return SendBundleResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SendBundleResponse>, I>>(object: I): SendBundleResponse {
    const message = createBaseSendBundleResponse();
    message.uuid = object.uuid ?? "";
    return message;
  },
};

function createBaseNextScheduledLeaderRequest(): NextScheduledLeaderRequest {
  return { regions: [] };
}

export const NextScheduledLeaderRequest = {
  encode(message: NextScheduledLeaderRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.regions) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NextScheduledLeaderRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNextScheduledLeaderRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.regions.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): NextScheduledLeaderRequest {
    return { regions: Array.isArray(object?.regions) ? object.regions.map((e: any) => String(e)) : [] };
  },

  toJSON(message: NextScheduledLeaderRequest): unknown {
    const obj: any = {};
    if (message.regions) {
      obj.regions = message.regions.map((e) => e);
    } else {
      obj.regions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<NextScheduledLeaderRequest>, I>>(base?: I): NextScheduledLeaderRequest {
    return NextScheduledLeaderRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NextScheduledLeaderRequest>, I>>(object: I): NextScheduledLeaderRequest {
    const message = createBaseNextScheduledLeaderRequest();
    message.regions = object.regions?.map((e) => e) || [];
    return message;
  },
};

function createBaseNextScheduledLeaderResponse(): NextScheduledLeaderResponse {
  return { currentSlot: 0, nextLeaderSlot: 0, nextLeaderIdentity: "", nextLeaderRegion: "" };
}

export const NextScheduledLeaderResponse = {
  encode(message: NextScheduledLeaderResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.currentSlot !== 0) {
      writer.uint32(8).uint64(message.currentSlot);
    }
    if (message.nextLeaderSlot !== 0) {
      writer.uint32(16).uint64(message.nextLeaderSlot);
    }
    if (message.nextLeaderIdentity !== "") {
      writer.uint32(26).string(message.nextLeaderIdentity);
    }
    if (message.nextLeaderRegion !== "") {
      writer.uint32(34).string(message.nextLeaderRegion);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NextScheduledLeaderResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNextScheduledLeaderResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.currentSlot = longToNumber(reader.uint64() as Long);
          break;
        case 2:
          message.nextLeaderSlot = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.nextLeaderIdentity = reader.string();
          break;
        case 4:
          message.nextLeaderRegion = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): NextScheduledLeaderResponse {
    return {
      currentSlot: isSet(object.currentSlot) ? Number(object.currentSlot) : 0,
      nextLeaderSlot: isSet(object.nextLeaderSlot) ? Number(object.nextLeaderSlot) : 0,
      nextLeaderIdentity: isSet(object.nextLeaderIdentity) ? String(object.nextLeaderIdentity) : "",
      nextLeaderRegion: isSet(object.nextLeaderRegion) ? String(object.nextLeaderRegion) : "",
    };
  },

  toJSON(message: NextScheduledLeaderResponse): unknown {
    const obj: any = {};
    message.currentSlot !== undefined && (obj.currentSlot = Math.round(message.currentSlot));
    message.nextLeaderSlot !== undefined && (obj.nextLeaderSlot = Math.round(message.nextLeaderSlot));
    message.nextLeaderIdentity !== undefined && (obj.nextLeaderIdentity = message.nextLeaderIdentity);
    message.nextLeaderRegion !== undefined && (obj.nextLeaderRegion = message.nextLeaderRegion);
    return obj;
  },

  create<I extends Exact<DeepPartial<NextScheduledLeaderResponse>, I>>(base?: I): NextScheduledLeaderResponse {
    return NextScheduledLeaderResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NextScheduledLeaderResponse>, I>>(object: I): NextScheduledLeaderResponse {
    const message = createBaseNextScheduledLeaderResponse();
    message.currentSlot = object.currentSlot ?? 0;
    message.nextLeaderSlot = object.nextLeaderSlot ?? 0;
    message.nextLeaderIdentity = object.nextLeaderIdentity ?? "";
    message.nextLeaderRegion = object.nextLeaderRegion ?? "";
    return message;
  },
};

function createBaseConnectedLeadersRequest(): ConnectedLeadersRequest {
  return {};
}

export const ConnectedLeadersRequest = {
  encode(_: ConnectedLeadersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): ConnectedLeadersRequest {
    return {};
  },

  toJSON(_: ConnectedLeadersRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersRequest>, I>>(base?: I): ConnectedLeadersRequest {
    return ConnectedLeadersRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersRequest>, I>>(_: I): ConnectedLeadersRequest {
    const message = createBaseConnectedLeadersRequest();
    return message;
  },
};

function createBaseConnectedLeadersRegionedRequest(): ConnectedLeadersRegionedRequest {
  return { regions: [] };
}

export const ConnectedLeadersRegionedRequest = {
  encode(message: ConnectedLeadersRegionedRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.regions) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersRegionedRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersRegionedRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.regions.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectedLeadersRegionedRequest {
    return { regions: Array.isArray(object?.regions) ? object.regions.map((e: any) => String(e)) : [] };
  },

  toJSON(message: ConnectedLeadersRegionedRequest): unknown {
    const obj: any = {};
    if (message.regions) {
      obj.regions = message.regions.map((e) => e);
    } else {
      obj.regions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersRegionedRequest>, I>>(base?: I): ConnectedLeadersRegionedRequest {
    return ConnectedLeadersRegionedRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersRegionedRequest>, I>>(
    object: I,
  ): ConnectedLeadersRegionedRequest {
    const message = createBaseConnectedLeadersRegionedRequest();
    message.regions = object.regions?.map((e) => e) || [];
    return message;
  },
};

function createBaseConnectedLeadersRegionedResponse(): ConnectedLeadersRegionedResponse {
  return { connectedValidators: {} };
}

export const ConnectedLeadersRegionedResponse = {
  encode(message: ConnectedLeadersRegionedResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.connectedValidators).forEach(([key, value]) => {
      ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry.encode(
        { key: key as any, value },
        writer.uint32(10).fork(),
      ).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersRegionedResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersRegionedResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          const entry1 = ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.connectedValidators[entry1.key] = entry1.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectedLeadersRegionedResponse {
    return {
      connectedValidators: isObject(object.connectedValidators)
        ? Object.entries(object.connectedValidators).reduce<{ [key: string]: ConnectedLeadersResponse }>(
          (acc, [key, value]) => {
            acc[key] = ConnectedLeadersResponse.fromJSON(value);
            return acc;
          },
          {},
        )
        : {},
    };
  },

  toJSON(message: ConnectedLeadersRegionedResponse): unknown {
    const obj: any = {};
    obj.connectedValidators = {};
    if (message.connectedValidators) {
      Object.entries(message.connectedValidators).forEach(([k, v]) => {
        obj.connectedValidators[k] = ConnectedLeadersResponse.toJSON(v);
      });
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersRegionedResponse>, I>>(
    base?: I,
  ): ConnectedLeadersRegionedResponse {
    return ConnectedLeadersRegionedResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersRegionedResponse>, I>>(
    object: I,
  ): ConnectedLeadersRegionedResponse {
    const message = createBaseConnectedLeadersRegionedResponse();
    message.connectedValidators = Object.entries(object.connectedValidators ?? {}).reduce<
      { [key: string]: ConnectedLeadersResponse }
    >((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = ConnectedLeadersResponse.fromPartial(value);
      }
      return acc;
    }, {});
    return message;
  },
};

function createBaseConnectedLeadersRegionedResponse_ConnectedValidatorsEntry(): ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
  return { key: "", value: undefined };
}

export const ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry = {
  encode(
    message: ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      ConnectedLeadersResponse.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedLeadersRegionedResponse_ConnectedValidatorsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = ConnectedLeadersResponse.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "",
      value: isSet(object.value) ? ConnectedLeadersResponse.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? ConnectedLeadersResponse.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry>, I>>(
    base?: I,
  ): ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
    return ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry>, I>>(
    object: I,
  ): ConnectedLeadersRegionedResponse_ConnectedValidatorsEntry {
    const message = createBaseConnectedLeadersRegionedResponse_ConnectedValidatorsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? ConnectedLeadersResponse.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseGetTipAccountsRequest(): GetTipAccountsRequest {
  return {};
}

export const GetTipAccountsRequest = {
  encode(_: GetTipAccountsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTipAccountsRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTipAccountsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): GetTipAccountsRequest {
    return {};
  },

  toJSON(_: GetTipAccountsRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTipAccountsRequest>, I>>(base?: I): GetTipAccountsRequest {
    return GetTipAccountsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetTipAccountsRequest>, I>>(_: I): GetTipAccountsRequest {
    const message = createBaseGetTipAccountsRequest();
    return message;
  },
};

function createBaseGetTipAccountsResponse(): GetTipAccountsResponse {
  return { accounts: [] };
}

export const GetTipAccountsResponse = {
  encode(message: GetTipAccountsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.accounts) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTipAccountsResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTipAccountsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.accounts.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetTipAccountsResponse {
    return { accounts: Array.isArray(object?.accounts) ? object.accounts.map((e: any) => String(e)) : [] };
  },

  toJSON(message: GetTipAccountsResponse): unknown {
    const obj: any = {};
    if (message.accounts) {
      obj.accounts = message.accounts.map((e) => e);
    } else {
      obj.accounts = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTipAccountsResponse>, I>>(base?: I): GetTipAccountsResponse {
    return GetTipAccountsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetTipAccountsResponse>, I>>(object: I): GetTipAccountsResponse {
    const message = createBaseGetTipAccountsResponse();
    message.accounts = object.accounts?.map((e) => e) || [];
    return message;
  },
};

function createBaseSubscribeBundleResultsRequest(): SubscribeBundleResultsRequest {
  return {};
}

export const SubscribeBundleResultsRequest = {
  encode(_: SubscribeBundleResultsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeBundleResultsRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeBundleResultsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): SubscribeBundleResultsRequest {
    return {};
  },

  toJSON(_: SubscribeBundleResultsRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeBundleResultsRequest>, I>>(base?: I): SubscribeBundleResultsRequest {
    return SubscribeBundleResultsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeBundleResultsRequest>, I>>(_: I): SubscribeBundleResultsRequest {
    const message = createBaseSubscribeBundleResultsRequest();
    return message;
  },
};

function createBaseGetRegionsRequest(): GetRegionsRequest {
  return {};
}

export const GetRegionsRequest = {
  encode(_: GetRegionsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetRegionsRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetRegionsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(_: any): GetRegionsRequest {
    return {};
  },

  toJSON(_: GetRegionsRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetRegionsRequest>, I>>(base?: I): GetRegionsRequest {
    return GetRegionsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetRegionsRequest>, I>>(_: I): GetRegionsRequest {
    const message = createBaseGetRegionsRequest();
    return message;
  },
};

function createBaseGetRegionsResponse(): GetRegionsResponse {
  return { currentRegion: "", availableRegions: [] };
}

export const GetRegionsResponse = {
  encode(message: GetRegionsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.currentRegion !== "") {
      writer.uint32(10).string(message.currentRegion);
    }
    for (const v of message.availableRegions) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetRegionsResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetRegionsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.currentRegion = reader.string();
          break;
        case 2:
          message.availableRegions.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): GetRegionsResponse {
    return {
      currentRegion: isSet(object.currentRegion) ? String(object.currentRegion) : "",
      availableRegions: Array.isArray(object?.availableRegions)
        ? object.availableRegions.map((e: any) => String(e))
        : [],
    };
  },

  toJSON(message: GetRegionsResponse): unknown {
    const obj: any = {};
    message.currentRegion !== undefined && (obj.currentRegion = message.currentRegion);
    if (message.availableRegions) {
      obj.availableRegions = message.availableRegions.map((e) => e);
    } else {
      obj.availableRegions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetRegionsResponse>, I>>(base?: I): GetRegionsResponse {
    return GetRegionsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetRegionsResponse>, I>>(object: I): GetRegionsResponse {
    const message = createBaseGetRegionsResponse();
    message.currentRegion = object.currentRegion ?? "";
    message.availableRegions = object.availableRegions?.map((e) => e) || [];
    return message;
  },
};

export type SearcherServiceService = typeof SearcherServiceService;
export const SearcherServiceService = {
  /**
   * Searchers can invoke this endpoint to subscribe to their respective bundle results.
   * A success result would indicate the bundle won its state auction and was submitted to the validator.
   */
  subscribeBundleResults: {
    path: "/searcher.SearcherService/SubscribeBundleResults",
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: SubscribeBundleResultsRequest) =>
      Buffer.from(SubscribeBundleResultsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SubscribeBundleResultsRequest.decode(value),
    responseSerialize: (value: BundleResult) => Buffer.from(BundleResult.encode(value).finish()),
    responseDeserialize: (value: Buffer) => BundleResult.decode(value),
  },
  sendBundle: {
    path: "/searcher.SearcherService/SendBundle",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SendBundleRequest) => Buffer.from(SendBundleRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SendBundleRequest.decode(value),
    responseSerialize: (value: SendBundleResponse) => Buffer.from(SendBundleResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SendBundleResponse.decode(value),
  },
  /** Returns the next scheduled leader connected to the block engine. */
  getNextScheduledLeader: {
    path: "/searcher.SearcherService/GetNextScheduledLeader",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: NextScheduledLeaderRequest) =>
      Buffer.from(NextScheduledLeaderRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => NextScheduledLeaderRequest.decode(value),
    responseSerialize: (value: NextScheduledLeaderResponse) =>
      Buffer.from(NextScheduledLeaderResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => NextScheduledLeaderResponse.decode(value),
  },
  /** Returns leader slots for connected jito validators during the current epoch. Only returns data for this region. */
  getConnectedLeaders: {
    path: "/searcher.SearcherService/GetConnectedLeaders",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ConnectedLeadersRequest) => Buffer.from(ConnectedLeadersRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ConnectedLeadersRequest.decode(value),
    responseSerialize: (value: ConnectedLeadersResponse) =>
      Buffer.from(ConnectedLeadersResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ConnectedLeadersResponse.decode(value),
  },
  /** Returns leader slots for connected jito validators during the current epoch. */
  getConnectedLeadersRegioned: {
    path: "/searcher.SearcherService/GetConnectedLeadersRegioned",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ConnectedLeadersRegionedRequest) =>
      Buffer.from(ConnectedLeadersRegionedRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ConnectedLeadersRegionedRequest.decode(value),
    responseSerialize: (value: ConnectedLeadersRegionedResponse) =>
      Buffer.from(ConnectedLeadersRegionedResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ConnectedLeadersRegionedResponse.decode(value),
  },
  /** Returns the tip accounts searchers shall transfer funds to for the leader to claim. */
  getTipAccounts: {
    path: "/searcher.SearcherService/GetTipAccounts",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTipAccountsRequest) => Buffer.from(GetTipAccountsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTipAccountsRequest.decode(value),
    responseSerialize: (value: GetTipAccountsResponse) => Buffer.from(GetTipAccountsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTipAccountsResponse.decode(value),
  },
  /** Returns region the client is directly connected to, along with all available regions */
  getRegions: {
    path: "/searcher.SearcherService/GetRegions",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetRegionsRequest) => Buffer.from(GetRegionsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetRegionsRequest.decode(value),
    responseSerialize: (value: GetRegionsResponse) => Buffer.from(GetRegionsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetRegionsResponse.decode(value),
  },
} as const;

export interface SearcherServiceServer extends UntypedServiceImplementation {
  /**
   * Searchers can invoke this endpoint to subscribe to their respective bundle results.
   * A success result would indicate the bundle won its state auction and was submitted to the validator.
   */
  subscribeBundleResults: handleServerStreamingCall<SubscribeBundleResultsRequest, BundleResult>;
  sendBundle: handleUnaryCall<SendBundleRequest, SendBundleResponse>;
  /** Returns the next scheduled leader connected to the block engine. */
  getNextScheduledLeader: handleUnaryCall<NextScheduledLeaderRequest, NextScheduledLeaderResponse>;
  /** Returns leader slots for connected jito validators during the current epoch. Only returns data for this region. */
  getConnectedLeaders: handleUnaryCall<ConnectedLeadersRequest, ConnectedLeadersResponse>;
  /** Returns leader slots for connected jito validators during the current epoch. */
  getConnectedLeadersRegioned: handleUnaryCall<ConnectedLeadersRegionedRequest, ConnectedLeadersRegionedResponse>;
  /** Returns the tip accounts searchers shall transfer funds to for the leader to claim. */
  getTipAccounts: handleUnaryCall<GetTipAccountsRequest, GetTipAccountsResponse>;
  /** Returns region the client is directly connected to, along with all available regions */
  getRegions: handleUnaryCall<GetRegionsRequest, GetRegionsResponse>;
}

export interface SearcherServiceClient extends Client {
  /**
   * Searchers can invoke this endpoint to subscribe to their respective bundle results.
   * A success result would indicate the bundle won its state auction and was submitted to the validator.
   */
  subscribeBundleResults(
    request: SubscribeBundleResultsRequest,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<BundleResult>;
  subscribeBundleResults(
    request: SubscribeBundleResultsRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<BundleResult>;
  sendBundle(
    request: SendBundleRequest,
    callback: (error: ServiceError | null, response: SendBundleResponse) => void,
  ): ClientUnaryCall;
  sendBundle(
    request: SendBundleRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SendBundleResponse) => void,
  ): ClientUnaryCall;
  sendBundle(
    request: SendBundleRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SendBundleResponse) => void,
  ): ClientUnaryCall;
  /** Returns the next scheduled leader connected to the block engine. */
  getNextScheduledLeader(
    request: NextScheduledLeaderRequest,
    callback: (error: ServiceError | null, response: NextScheduledLeaderResponse) => void,
  ): ClientUnaryCall;
  getNextScheduledLeader(
    request: NextScheduledLeaderRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: NextScheduledLeaderResponse) => void,
  ): ClientUnaryCall;
  getNextScheduledLeader(
    request: NextScheduledLeaderRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: NextScheduledLeaderResponse) => void,
  ): ClientUnaryCall;
  /** Returns leader slots for connected jito validators during the current epoch. Only returns data for this region. */
  getConnectedLeaders(
    request: ConnectedLeadersRequest,
    callback: (error: ServiceError | null, response: ConnectedLeadersResponse) => void,
  ): ClientUnaryCall;
  getConnectedLeaders(
    request: ConnectedLeadersRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ConnectedLeadersResponse) => void,
  ): ClientUnaryCall;
  getConnectedLeaders(
    request: ConnectedLeadersRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ConnectedLeadersResponse) => void,
  ): ClientUnaryCall;
  /** Returns leader slots for connected jito validators during the current epoch. */
  getConnectedLeadersRegioned(
    request: ConnectedLeadersRegionedRequest,
    callback: (error: ServiceError | null, response: ConnectedLeadersRegionedResponse) => void,
  ): ClientUnaryCall;
  getConnectedLeadersRegioned(
    request: ConnectedLeadersRegionedRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ConnectedLeadersRegionedResponse) => void,
  ): ClientUnaryCall;
  getConnectedLeadersRegioned(
    request: ConnectedLeadersRegionedRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ConnectedLeadersRegionedResponse) => void,
  ): ClientUnaryCall;
  /** Returns the tip accounts searchers shall transfer funds to for the leader to claim. */
  getTipAccounts(
    request: GetTipAccountsRequest,
    callback: (error: ServiceError | null, response: GetTipAccountsResponse) => void,
  ): ClientUnaryCall;
  getTipAccounts(
    request: GetTipAccountsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTipAccountsResponse) => void,
  ): ClientUnaryCall;
  getTipAccounts(
    request: GetTipAccountsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTipAccountsResponse) => void,
  ): ClientUnaryCall;
  /** Returns region the client is directly connected to, along with all available regions */
  getRegions(
    request: GetRegionsRequest,
    callback: (error: ServiceError | null, response: GetRegionsResponse) => void,
  ): ClientUnaryCall;
  getRegions(
    request: GetRegionsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetRegionsResponse) => void,
  ): ClientUnaryCall;
  getRegions(
    request: GetRegionsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetRegionsResponse) => void,
  ): ClientUnaryCall;
}

export const SearcherServiceClient = makeGenericClientConstructor(
  SearcherServiceService,
  "searcher.SearcherService",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): SearcherServiceClient;
  service: typeof SearcherServiceService;
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
