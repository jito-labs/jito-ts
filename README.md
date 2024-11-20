# jito-ts

[![Discord](https://img.shields.io/discord/938287290806042626?label=Discord&logo=discord&style=flat&color=7289DA)](https://discord.gg/jTSmEzaR)
[![NPM Version](https://img.shields.io/npm/v/jito-ts)](https://www.npmjs.com/package/jito-ts)

Welcome to the Jito Typescript SDK repository! Use this to interact with the block-engine, relayer and future Jito APIs.

## Setup
Use with yarn `1.22`+ and Node 20.
```bash
yarn
```

### Building Protos
The generated proto files have been committed for convenience, but if there's ever a change you'll need to re-generate.
Steps to regenerate:
* Make sure you have protoc installed on your system
* If any new `.proto` files were added, update the appropriate `./scripts/gen-*-protos` script to include it.
* Run the appropriate `yarn gen-* ${PATH_TO_PROTOS}` and commit!

### Geyser

**Note:** Mac users may run into an error to the effect of "protoc-gen-js: program not found or is not executable";
if this is thrown, run:
* `brew install protobuf@3`
* `brew link --overwrite protobuf@3`
* `yarn gen-block-engine ${PATH_TO_BLOCK_ENGINE_PROTOS}`
* `yarn gen-geyser ${PATH_TO_GEYSER_PROTOS}`

## Usage

```bash
export RPC_URL="https://MY_RPC_URL"
export BLOCK_ENGINE_URL=mainnet.block-engine.jito.wtf
export AUTH_KEYPAIR_PATH=MY_AUTH_KEYPAIR.json
export BUNDLE_TRANSACTION_LIMIT=5

yarn run:simple_bundle
```

See other commands in `package.json`
