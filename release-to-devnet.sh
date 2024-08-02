#!/usr/bin/env bash

set -ex pipefail

RPC_URL=https://solana-devnet.g.alchemy.com/v2/eXf3xv8NTResmuytiC4ZORpkDr4Hy5HO
WALLET_WITH_FUNDS=~/.config/solana/mydev.json
PROGRAM_ID=8AHhgx8bNF4oejgfUzN6A7ZN1CPrh8NMsgnrcDiNgUiZ

# build program
anchor build -- --features enable-gpl

# patch types, which we want in rust, but anchor client doesn't support
./idl-fixup.sh

# update types in ts client package
cp -v ./target/types/mango_v4.ts ./ts/client/src/mango_v4.ts

(cd ./ts/client && yarn tsc)

# publish program
solana --url $RPC_URL program deploy --program-id $PROGRAM_ID  \
    -k $WALLET_WITH_FUNDS target/deploy/mango_v4.so --skip-fee-check -v

# publish idl
anchor idl upgrade --provider.cluster $RPC_URL --provider.wallet $WALLET_WITH_FUNDS \
    --filepath target/idl/mango_v4_no_docs.json $PROGRAM_ID
