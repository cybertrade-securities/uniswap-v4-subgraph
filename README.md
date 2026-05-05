# Uniswap V4 Subgraph

### Running Unit Tests

1. Install [Docker](https://docs.docker.com/get-docker/) if you don't have it already
2. Install postgres: `brew install postgresql`
3. `yarn run build:docker`
4. `yarn run test`

### Adding New Chains

1. Create a new subgraph config in `src/utils/chains.ts`. This will require adding a new `<NETWORK_NAME>_NETWORK_NAME` const for the corresponding network.
2. Add a new entry in `networks.json` for the new chain. The network name should be derived from the CLI Name in The Graph's [supported networks documenation](https://thegraph.com/docs/en/developing/supported-networks/). The factory address can be derived from Uniswap's deployments documentation (not yet available).
3. To deploy to Alchemy, run the following command:

```
yarn run deploy:alchemy --
  <SUBGRAPH_NAME>
  --version-label <VERSION_LABEL>
  --deploy-key <DEPLOYMENT_KEY>
  --network <NETWORK_NAME>
```

## Generating subgraph.yaml

The `subgraph.yaml` file can be automatically generated from the `networks.json` configuration for a specific network. This ensures that all contract addresses and start blocks are correctly synchronized.

To generate the subgraph.yaml:

1. Make sure your `networks.json` is up to date with the correct contract addresses and start blocks
2. Run:
   ```bash
   yarn generate-subgraph <network>
   ```
   For example:
   ```bash
   yarn generate-subgraph mainnet
   # or
   yarn generate-subgraph arbitrum-one
   ```

This will create a new `subgraph.yaml` file based on the network-specific configuration. The script will:

- Use the contract templates defined for each contract type (PoolManager, PositionManager, etc.)
- Generate data sources for each contract in the specified network
- Preserve all the necessary event handlers and ABI configurations

Available networks can be found in `networks.json`.

## Trimmed Pool Metadata Indexing Profile

This repository has been reduced to the pool metadata surface used by the application. The subgraph now focuses on discovering Uniswap V4 pools and their token metadata. It does not index swaps, liquidity changes, positions, aggregate protocol metrics, daily/hourly snapshots, or pricing data for the active query path.

### Active entities

The schema intentionally contains only `Pool` and `Token`:

```graphql
type Token @entity(immutable: false) {
  id: ID!
  symbol: String!
  name: String!
  decimals: BigInt!
}

type Pool @entity(immutable: false) {
  id: ID!
  token0: Token!
  token1: Token!
  createdAtBlockNumber: BigInt!
  hooks: String!
  tickSpacing: BigInt!
  feeTier: BigInt!
}
```

These fields match the application query requirements:

- pool id
- token0 and token1 id/symbol/name/decimals
- pool creation block
- hook address
- tick spacing
- fee tier

### Active indexing behavior

The active mapping indexes the `PoolManager.Initialize` event. When a pool is initialized, the handler:

- creates the `Pool` entity using the pool id
- creates or loads `Token` entities for `token0` and `token1`
- reads token `symbol`, `name`, and `decimals`
- stores `createdAtBlockNumber`
- stores pool `hooks`
- stores `tickSpacing`
- stores `feeTier`

The generated manifest keeps the `PoolManager` datasource and the ERC20 ABIs needed to read token metadata. Removed active indexing surface includes position manager handling, swap handling, modify-liquidity handling, subscriptions, transfers, pricing, interval updates, ticks, transaction entities, and aggregate entities.

### Supported application queries

Pool by id:

```graphql
query($id: ID!) {
  pool(id: $id) {
    id
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    createdAtBlockNumber
    hooks
    tickSpacing
    feeTier
  }
}
```

Paginated pools:

```graphql
query($pageSize: Int!, $cursor: ID!) {
  pools(first: $pageSize, orderBy: id, orderDirection: asc, where: { id_gt: $cursor }) {
    id
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    createdAtBlockNumber
    hooks
    tickSpacing
    feeTier
  }
}
```

### What was removed

The schema and active manifest were trimmed so the deployed subgraph does not store or update entities that are not queried by the application. Removed active entities and indexing concerns include:

- pool manager aggregates
- bundle/native price state
- swap records
- modify-liquidity records
- position and transfer records
- tick records
- pool day/hour data
- token day/hour data
- transaction records
- total value locked and volume accounting
- fee analytics and USD pricing helpers

Some legacy source files may remain in the repository for historical context, but they are not part of the active trimmed manifest/query path.

### Verification performed

The trimmed subgraph was verified with:

```bash
COREPACK_ENABLE_AUTO_PIN=0 corepack yarn install --frozen-lockfile
COREPACK_ENABLE_AUTO_PIN=0 corepack yarn build
```

Matchstick tests were not run successfully in this environment because they require Docker.
