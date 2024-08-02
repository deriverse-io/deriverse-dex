_work in progress_

## License

See the LICENSE file.

The majority of this repo is MIT licensed, but some parts needed for compiling
the solana program are under GPL.

All GPL code is gated behind the `enable-gpl` feature. If you use the `mango-v4`
crate as a dependency with the `client` or `cpi` features, you use only MIT
parts of it.

The intention is for you to be able to depend on the `mango-v4` crate for
building closed-source tools and integrations, including other solana programs
that call into the mango program.

But deriving a solana program with similar functionality to the mango program
from this codebase would require the changes and improvements to stay publicly
available under GPL.

## Development

See DEVELOPING.md and FAQ-DEV.md

### Dependencies

- rust version 1.70.0
- solana-cli 1.16.7
- anchor-cli 0.29.0
- npm 8.1.2
- node v16.13.1

MacOS M1 note - in `rust-toolchain.toml` file replace channel to `1.70.0-x86_64-apple-darwin`.

> **_For Mac with M1:_** In `rust-toolchain.toml` file replace channel to `1.70.0-x86_64-apple-darwin`

### Deployments

- devnet: work in progress
- mainnet-beta: work in progress
- primary mango group on mainnet-beta: work in progress

### Start

### Deploy to devnet

``` bash
anchor build -- --features "enable-gpl"
anchor keys list
# it should return mango_v4: <you program id>
# in programs/mango-v4/src/lib.rs replace declare_id with your one

# find file release-to-devnet.sh and change RPC_URL and PROGRAM_ID for your need
# also look at WALLET_WITH_FUNDS file, it should point to file with private key to wallet with funds on devnet
# then run:
./release-to-devnet.sh

# you deployed dex program properly
```

#### Create own token

``` bash
spl-token create-token
# it will return some token address, copy it
spl-token mint <token address> 10000000000 # or how many you want
```

#### Init market and group

Go to `devnet-admin.ts` file.
``` javascript
const DEVNET_MINTS = new Map([
  ['USDC', '<replace with your token id>'], // use devnet usdc
  ['SOL', 'So11111111111111111111111111111111111111112'],
]);

// adjust those constants
const RCP_ENDPOINT = process.env.RCP_ENDPOINT || 'https://api.devnet.solana.com';
const ADMIN_KEYPAIR = process.env.ADMIN_KEYPAIR || '<path>/.config/solana/id.json';
const CLUSTER = process.env.CLUSTER || 'devnet';
```

Run this script. From log read group id and make sure that market is created.

#### Create account

Now using Mango cli we will create new account. To run to, go into `./bin/cli`. Build project using cargo build. After that:
`cargo run create-account --group <your group id> --owner ~/.config/solana/id.json --url d`
You can also use .env file.

After those steps your devnet env should be ready to use.