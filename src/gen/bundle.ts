/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Packet } from "./packet";
import { Header } from "./shared";

export const protobufPackage = "bundle";

export interface Bundle {
  header: Header | undefined;
  packets: Packet[];
}

export interface BundleUuid {
  bundle: Bundle | undefined;
  uuid: string;
}

/**
 * Indicates the bundle was accepted and forwarded to a validator.
 * NOTE: A single bundle may have multiple events emitted if forwarded to many validators.
 */
export interface Accepted {
  /** Slot at which bundle was forwarded. */
  slot: number;
  /** Validator identity bundle was forwarded to. */
  validatorIdentity: string;
}

/** Indicates the bundle was dropped and therefore not forwarded to any validator. */
export interface Rejected {
  stateAuctionBidRejected?: StateAuctionBidRejected | undefined;
  winningBatchBidRejected?: WinningBatchBidRejected | undefined;
  simulationFailure?: SimulationFailure | undefined;
  internalError?: InternalError | undefined;
}

/**
 * Indicates the bundle's bid was high enough to win its state auction.
 * However, not high enough relative to other state auction winners and therefore excluded from being forwarded.
 */
export interface WinningBatchBidRejected {
  /** Auction's unique identifier. */
  auctionId: string;
  /** Bundle's simulated bid. */
  simulatedBidLamports: number;
  msg?: string | undefined;
}

/** Indicates the bundle's bid was __not__ high enough to be included in its state auction's set of winners. */
export interface StateAuctionBidRejected {
  /** Auction's unique identifier. */
  auctionId: string;
  /** Bundle's simulated bid. */
  simulatedBidLamports: number;
  msg?: string | undefined;
}

/** Bundle dropped due to simulation failure. */
export interface SimulationFailure {
  /** Signature of the offending transaction. */
  txSignature: string;
  msg?: string | undefined;
}

/** Bundle dropped due to an internal error. */
export interface InternalError {
  msg: string;
}

export interface BundleResult {
  /** Bundle's Uuid. */
  bundleId: string;
  accepted?: Accepted | undefined;
  rejected?: Rejected | undefined;
}

function createBaseBundle(): Bundle {
  return { header: undefined, packets: [] };
}

export const Bundle = {
  encode(message: Bundle, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      Header.encode(message.header, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.packets) {
      Packet.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Bundle {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBundle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.header = Header.decode(reader, reader.uint32());
          break;
        case 3:
          message.packets.push(Packet.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Bundle {
    return {
      header: isSet(object.header) ? Header.fromJSON(object.header) : undefined,
      packets: Array.isArray(object?.packets) ? object.packets.map((e: any) => Packet.fromJSON(e)) : [],
    };
  },

  toJSON(message: Bundle): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = message.header ? Header.toJSON(message.header) : undefined);
    if (message.packets) {
      obj.packets = message.packets.map((e) => e ? Packet.toJSON(e) : undefined);
    } else {
      obj.packets = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Bundle>, I>>(base?: I): Bundle {
    return Bundle.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Bundle>, I>>(object: I): Bundle {
    const message = createBaseBundle();
    message.header = (object.header !== undefined && object.header !== null)
      ? Header.fromPartial(object.header)
      : undefined;
    message.packets = object.packets?.map((e) => Packet.fromPartial(e)) || [];
    return message;
  },
};

function createBaseBundleUuid(): BundleUuid {
  return { bundle: undefined, uuid: "" };
}

export const BundleUuid = {
  encode(message: BundleUuid, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.bundle !== undefined) {
      Bundle.encode(message.bundle, writer.uint32(10).fork()).ldelim();
    }
    if (message.uuid !== "") {
      writer.uint32(18).string(message.uuid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BundleUuid {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBundleUuid();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bundle = Bundle.decode(reader, reader.uint32());
          break;
        case 2:
          message.uuid = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): BundleUuid {
    return {
      bundle: isSet(object.bundle) ? Bundle.fromJSON(object.bundle) : undefined,
      uuid: isSet(object.uuid) ? String(object.uuid) : "",
    };
  },

  toJSON(message: BundleUuid): unknown {
    const obj: any = {};
    message.bundle !== undefined && (obj.bundle = message.bundle ? Bundle.toJSON(message.bundle) : undefined);
    message.uuid !== undefined && (obj.uuid = message.uuid);
    return obj;
  },

  create<I extends Exact<DeepPartial<BundleUuid>, I>>(base?: I): BundleUuid {
    return BundleUuid.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BundleUuid>, I>>(object: I): BundleUuid {
    const message = createBaseBundleUuid();
    message.bundle = (object.bundle !== undefined && object.bundle !== null)
      ? Bundle.fromPartial(object.bundle)
      : undefined;
    message.uuid = object.uuid ?? "";
    return message;
  },
};

function createBaseAccepted(): Accepted {
  return { slot: 0, validatorIdentity: "" };
}

export const Accepted = {
  encode(message: Accepted, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slot !== 0) {
      writer.uint32(8).uint64(message.slot);
    }
    if (message.validatorIdentity !== "") {
      writer.uint32(18).string(message.validatorIdentity);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Accepted {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAccepted();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.slot = longToNumber(reader.uint64() as Long);
          break;
        case 2:
          message.validatorIdentity = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Accepted {
    return {
      slot: isSet(object.slot) ? Number(object.slot) : 0,
      validatorIdentity: isSet(object.validatorIdentity) ? String(object.validatorIdentity) : "",
    };
  },

  toJSON(message: Accepted): unknown {
    const obj: any = {};
    message.slot !== undefined && (obj.slot = Math.round(message.slot));
    message.validatorIdentity !== undefined && (obj.validatorIdentity = message.validatorIdentity);
    return obj;
  },

  create<I extends Exact<DeepPartial<Accepted>, I>>(base?: I): Accepted {
    return Accepted.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Accepted>, I>>(object: I): Accepted {
    const message = createBaseAccepted();
    message.slot = object.slot ?? 0;
    message.validatorIdentity = object.validatorIdentity ?? "";
    return message;
  },
};

function createBaseRejected(): Rejected {
  return {
    stateAuctionBidRejected: undefined,
    winningBatchBidRejected: undefined,
    simulationFailure: undefined,
    internalError: undefined,
  };
}

export const Rejected = {
  encode(message: Rejected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.stateAuctionBidRejected !== undefined) {
      StateAuctionBidRejected.encode(message.stateAuctionBidRejected, writer.uint32(10).fork()).ldelim();
    }
    if (message.winningBatchBidRejected !== undefined) {
      WinningBatchBidRejected.encode(message.winningBatchBidRejected, writer.uint32(18).fork()).ldelim();
    }
    if (message.simulationFailure !== undefined) {
      SimulationFailure.encode(message.simulationFailure, writer.uint32(26).fork()).ldelim();
    }
    if (message.internalError !== undefined) {
      InternalError.encode(message.internalError, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Rejected {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRejected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.stateAuctionBidRejected = StateAuctionBidRejected.decode(reader, reader.uint32());
          break;
        case 2:
          message.winningBatchBidRejected = WinningBatchBidRejected.decode(reader, reader.uint32());
          break;
        case 3:
          message.simulationFailure = SimulationFailure.decode(reader, reader.uint32());
          break;
        case 4:
          message.internalError = InternalError.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Rejected {
    return {
      stateAuctionBidRejected: isSet(object.stateAuctionBidRejected)
        ? StateAuctionBidRejected.fromJSON(object.stateAuctionBidRejected)
        : undefined,
      winningBatchBidRejected: isSet(object.winningBatchBidRejected)
        ? WinningBatchBidRejected.fromJSON(object.winningBatchBidRejected)
        : undefined,
      simulationFailure: isSet(object.simulationFailure)
        ? SimulationFailure.fromJSON(object.simulationFailure)
        : undefined,
      internalError: isSet(object.internalError) ? InternalError.fromJSON(object.internalError) : undefined,
    };
  },

  toJSON(message: Rejected): unknown {
    const obj: any = {};
    message.stateAuctionBidRejected !== undefined && (obj.stateAuctionBidRejected = message.stateAuctionBidRejected
      ? StateAuctionBidRejected.toJSON(message.stateAuctionBidRejected)
      : undefined);
    message.winningBatchBidRejected !== undefined && (obj.winningBatchBidRejected = message.winningBatchBidRejected
      ? WinningBatchBidRejected.toJSON(message.winningBatchBidRejected)
      : undefined);
    message.simulationFailure !== undefined && (obj.simulationFailure = message.simulationFailure
      ? SimulationFailure.toJSON(message.simulationFailure)
      : undefined);
    message.internalError !== undefined &&
      (obj.internalError = message.internalError ? InternalError.toJSON(message.internalError) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Rejected>, I>>(base?: I): Rejected {
    return Rejected.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Rejected>, I>>(object: I): Rejected {
    const message = createBaseRejected();
    message.stateAuctionBidRejected =
      (object.stateAuctionBidRejected !== undefined && object.stateAuctionBidRejected !== null)
        ? StateAuctionBidRejected.fromPartial(object.stateAuctionBidRejected)
        : undefined;
    message.winningBatchBidRejected =
      (object.winningBatchBidRejected !== undefined && object.winningBatchBidRejected !== null)
        ? WinningBatchBidRejected.fromPartial(object.winningBatchBidRejected)
        : undefined;
    message.simulationFailure = (object.simulationFailure !== undefined && object.simulationFailure !== null)
      ? SimulationFailure.fromPartial(object.simulationFailure)
      : undefined;
    message.internalError = (object.internalError !== undefined && object.internalError !== null)
      ? InternalError.fromPartial(object.internalError)
      : undefined;
    return message;
  },
};

function createBaseWinningBatchBidRejected(): WinningBatchBidRejected {
  return { auctionId: "", simulatedBidLamports: 0, msg: undefined };
}

export const WinningBatchBidRejected = {
  encode(message: WinningBatchBidRejected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.auctionId !== "") {
      writer.uint32(10).string(message.auctionId);
    }
    if (message.simulatedBidLamports !== 0) {
      writer.uint32(16).uint64(message.simulatedBidLamports);
    }
    if (message.msg !== undefined) {
      writer.uint32(26).string(message.msg);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WinningBatchBidRejected {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWinningBatchBidRejected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.auctionId = reader.string();
          break;
        case 2:
          message.simulatedBidLamports = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.msg = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): WinningBatchBidRejected {
    return {
      auctionId: isSet(object.auctionId) ? String(object.auctionId) : "",
      simulatedBidLamports: isSet(object.simulatedBidLamports) ? Number(object.simulatedBidLamports) : 0,
      msg: isSet(object.msg) ? String(object.msg) : undefined,
    };
  },

  toJSON(message: WinningBatchBidRejected): unknown {
    const obj: any = {};
    message.auctionId !== undefined && (obj.auctionId = message.auctionId);
    message.simulatedBidLamports !== undefined && (obj.simulatedBidLamports = Math.round(message.simulatedBidLamports));
    message.msg !== undefined && (obj.msg = message.msg);
    return obj;
  },

  create<I extends Exact<DeepPartial<WinningBatchBidRejected>, I>>(base?: I): WinningBatchBidRejected {
    return WinningBatchBidRejected.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<WinningBatchBidRejected>, I>>(object: I): WinningBatchBidRejected {
    const message = createBaseWinningBatchBidRejected();
    message.auctionId = object.auctionId ?? "";
    message.simulatedBidLamports = object.simulatedBidLamports ?? 0;
    message.msg = object.msg ?? undefined;
    return message;
  },
};

function createBaseStateAuctionBidRejected(): StateAuctionBidRejected {
  return { auctionId: "", simulatedBidLamports: 0, msg: undefined };
}

export const StateAuctionBidRejected = {
  encode(message: StateAuctionBidRejected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.auctionId !== "") {
      writer.uint32(10).string(message.auctionId);
    }
    if (message.simulatedBidLamports !== 0) {
      writer.uint32(16).uint64(message.simulatedBidLamports);
    }
    if (message.msg !== undefined) {
      writer.uint32(26).string(message.msg);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StateAuctionBidRejected {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStateAuctionBidRejected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.auctionId = reader.string();
          break;
        case 2:
          message.simulatedBidLamports = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.msg = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StateAuctionBidRejected {
    return {
      auctionId: isSet(object.auctionId) ? String(object.auctionId) : "",
      simulatedBidLamports: isSet(object.simulatedBidLamports) ? Number(object.simulatedBidLamports) : 0,
      msg: isSet(object.msg) ? String(object.msg) : undefined,
    };
  },

  toJSON(message: StateAuctionBidRejected): unknown {
    const obj: any = {};
    message.auctionId !== undefined && (obj.auctionId = message.auctionId);
    message.simulatedBidLamports !== undefined && (obj.simulatedBidLamports = Math.round(message.simulatedBidLamports));
    message.msg !== undefined && (obj.msg = message.msg);
    return obj;
  },

  create<I extends Exact<DeepPartial<StateAuctionBidRejected>, I>>(base?: I): StateAuctionBidRejected {
    return StateAuctionBidRejected.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StateAuctionBidRejected>, I>>(object: I): StateAuctionBidRejected {
    const message = createBaseStateAuctionBidRejected();
    message.auctionId = object.auctionId ?? "";
    message.simulatedBidLamports = object.simulatedBidLamports ?? 0;
    message.msg = object.msg ?? undefined;
    return message;
  },
};

function createBaseSimulationFailure(): SimulationFailure {
  return { txSignature: "", msg: undefined };
}

export const SimulationFailure = {
  encode(message: SimulationFailure, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.txSignature !== "") {
      writer.uint32(10).string(message.txSignature);
    }
    if (message.msg !== undefined) {
      writer.uint32(18).string(message.msg);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SimulationFailure {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulationFailure();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.txSignature = reader.string();
          break;
        case 2:
          message.msg = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SimulationFailure {
    return {
      txSignature: isSet(object.txSignature) ? String(object.txSignature) : "",
      msg: isSet(object.msg) ? String(object.msg) : undefined,
    };
  },

  toJSON(message: SimulationFailure): unknown {
    const obj: any = {};
    message.txSignature !== undefined && (obj.txSignature = message.txSignature);
    message.msg !== undefined && (obj.msg = message.msg);
    return obj;
  },

  create<I extends Exact<DeepPartial<SimulationFailure>, I>>(base?: I): SimulationFailure {
    return SimulationFailure.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SimulationFailure>, I>>(object: I): SimulationFailure {
    const message = createBaseSimulationFailure();
    message.txSignature = object.txSignature ?? "";
    message.msg = object.msg ?? undefined;
    return message;
  },
};

function createBaseInternalError(): InternalError {
  return { msg: "" };
}

export const InternalError = {
  encode(message: InternalError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.msg !== "") {
      writer.uint32(10).string(message.msg);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InternalError {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInternalError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.msg = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): InternalError {
    return { msg: isSet(object.msg) ? String(object.msg) : "" };
  },

  toJSON(message: InternalError): unknown {
    const obj: any = {};
    message.msg !== undefined && (obj.msg = message.msg);
    return obj;
  },

  create<I extends Exact<DeepPartial<InternalError>, I>>(base?: I): InternalError {
    return InternalError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InternalError>, I>>(object: I): InternalError {
    const message = createBaseInternalError();
    message.msg = object.msg ?? "";
    return message;
  },
};

function createBaseBundleResult(): BundleResult {
  return { bundleId: "", accepted: undefined, rejected: undefined };
}

export const BundleResult = {
  encode(message: BundleResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.bundleId !== "") {
      writer.uint32(10).string(message.bundleId);
    }
    if (message.accepted !== undefined) {
      Accepted.encode(message.accepted, writer.uint32(18).fork()).ldelim();
    }
    if (message.rejected !== undefined) {
      Rejected.encode(message.rejected, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BundleResult {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBundleResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.bundleId = reader.string();
          break;
        case 2:
          message.accepted = Accepted.decode(reader, reader.uint32());
          break;
        case 3:
          message.rejected = Rejected.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): BundleResult {
    return {
      bundleId: isSet(object.bundleId) ? String(object.bundleId) : "",
      accepted: isSet(object.accepted) ? Accepted.fromJSON(object.accepted) : undefined,
      rejected: isSet(object.rejected) ? Rejected.fromJSON(object.rejected) : undefined,
    };
  },

  toJSON(message: BundleResult): unknown {
    const obj: any = {};
    message.bundleId !== undefined && (obj.bundleId = message.bundleId);
    message.accepted !== undefined && (obj.accepted = message.accepted ? Accepted.toJSON(message.accepted) : undefined);
    message.rejected !== undefined && (obj.rejected = message.rejected ? Rejected.toJSON(message.rejected) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<BundleResult>, I>>(base?: I): BundleResult {
    return BundleResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BundleResult>, I>>(object: I): BundleResult {
    const message = createBaseBundleResult();
    message.bundleId = object.bundleId ?? "";
    message.accepted = (object.accepted !== undefined && object.accepted !== null)
      ? Accepted.fromPartial(object.accepted)
      : undefined;
    message.rejected = (object.rejected !== undefined && object.rejected !== null)
      ? Rejected.fromPartial(object.rejected)
      : undefined;
    return message;
  },
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

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
