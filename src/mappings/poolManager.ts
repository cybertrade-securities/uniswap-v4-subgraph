import { BigInt, log } from '@graphprotocol/graph-ts'

import { Initialize as InitializeEvent } from '../types/PoolManager/PoolManager'
import { Pool, Token } from '../types/schema'
import { getSubgraphConfig, SubgraphConfig } from '../utils/chains'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from '../utils/token'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handleInitialize(event: InitializeEvent): void {
  handleInitializeHelper(event)
}

export function handleInitializeHelper(
  event: InitializeEvent,
  subgraphConfig: SubgraphConfig = getSubgraphConfig(),
): void {
  const tokenOverrides = subgraphConfig.tokenOverrides
  const poolsToSkip = subgraphConfig.poolsToSkip
  const nativeTokenDetails = subgraphConfig.nativeTokenDetails
  const poolId = event.params.id.toHexString()

  if (poolsToSkip.includes(poolId)) {
    return
  }

  const pool = new Pool(poolId)
  let token0 = Token.load(event.params.currency0.toHexString())
  let token1 = Token.load(event.params.currency1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.currency0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.currency0, tokenOverrides, nativeTokenDetails)
    token0.name = fetchTokenName(event.params.currency0, tokenOverrides, nativeTokenDetails)
    const decimals = fetchTokenDecimals(event.params.currency0, tokenOverrides, nativeTokenDetails)

    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
  }

  if (token1 === null) {
    token1 = new Token(event.params.currency1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.currency1, tokenOverrides, nativeTokenDetails)
    token1.name = fetchTokenName(event.params.currency1, tokenOverrides, nativeTokenDetails)
    const decimals = fetchTokenDecimals(event.params.currency1, tokenOverrides, nativeTokenDetails)

    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token1.decimals = decimals
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.hooks = event.params.hooks.toHexString()
  pool.tickSpacing = BigInt.fromI32(event.params.tickSpacing)
  pool.createdAtBlockNumber = event.block.number

  pool.save()
  token0.save()
  token1.save()
}
