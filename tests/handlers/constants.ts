import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { assert, createMockedFunction, newMockEvent } from 'matchstick-as'

import { Initialize } from '../../src/types/PoolManager/PoolManager'
import { Token } from '../../src/types/schema'
import { SubgraphConfig } from '../../src/utils/chains'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

const POOL_MANAGER_ADDRESS = '0xE8E23e97Fa135823143d6b9Cba9c699040D51F70'
const USDC_MAINNET_ADDRESS = '0x5d1abc83973c773d122ae7c551251cc9be2baecc'
const WETH_MAINNET_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

export const USDC_WETH_POOL_ID = '0x85c41d6535ebab7661979fa7a5d331e4cb229b4d1e7dde1a78ae298fab8ca5bb'

export const TEST_CONFIG: SubgraphConfig = {
  poolManagerAddress: POOL_MANAGER_ADDRESS,
  stablecoinWrappedNativePoolId: USDC_WETH_POOL_ID,
  stablecoinIsToken0: true,
  wrappedNativeAddress: WETH_MAINNET_ADDRESS,
  minimumNativeLocked: BigInt.zero().toBigDecimal(),
  stablecoinAddresses: [USDC_MAINNET_ADDRESS],
  whitelistTokens: [WETH_MAINNET_ADDRESS, USDC_MAINNET_ADDRESS],
  tokenOverrides: [],
  poolsToSkip: [],
  poolMappings: [],
  nativeTokenDetails: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: BigInt.fromI32(18),
  },
}

export class TokenFixture {
  address: string
  symbol: string
  name: string
  totalSupply: string
  decimals: string
}

export const USDC_MAINNET_FIXTURE: TokenFixture = {
  address: USDC_MAINNET_ADDRESS,
  symbol: 'USDC',
  name: 'USD Coin',
  totalSupply: '300',
  decimals: '18',
}

export const WETH_MAINNET_FIXTURE: TokenFixture = {
  address: WETH_MAINNET_ADDRESS,
  symbol: 'WETH',
  name: 'Wrapped Ether',
  totalSupply: '100',
  decimals: '18',
}

export const MOCK_EVENT = newMockEvent()

export function createInitializeEvent(
  poolId: string = USDC_WETH_POOL_ID,
  token0: TokenFixture = USDC_MAINNET_FIXTURE,
  token1: TokenFixture = WETH_MAINNET_FIXTURE,
): Initialize {
  const id = Bytes.fromHexString(poolId) as Bytes
  return new Initialize(
    MOCK_EVENT.address,
    MOCK_EVENT.logIndex,
    MOCK_EVENT.transactionLogIndex,
    MOCK_EVENT.logType,
    MOCK_EVENT.block,
    MOCK_EVENT.transaction,
    [
      new ethereum.EventParam('id', ethereum.Value.fromFixedBytes(id)),
      new ethereum.EventParam('currency0', ethereum.Value.fromAddress(Address.fromString(token0.address))),
      new ethereum.EventParam('currency1', ethereum.Value.fromAddress(Address.fromString(token1.address))),
      new ethereum.EventParam('fee', ethereum.Value.fromI32(500)),
      new ethereum.EventParam('tickSpacing', ethereum.Value.fromI32(10)),
      new ethereum.EventParam('hooks', ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO))),
      new ethereum.EventParam('sqrtPriceX96', ethereum.Value.fromUnsignedBigInt(BigInt.fromString('1'))),
      new ethereum.EventParam('tick', ethereum.Value.fromI32(1)),
    ],
    MOCK_EVENT.receipt,
  )
}

export function mockTokenCalls(token: TokenFixture): void {
  const tokenAddress = Address.fromString(token.address)
  createMockedFunction(tokenAddress, 'symbol', 'symbol():(string)').returns([ethereum.Value.fromString(token.symbol)])
  createMockedFunction(tokenAddress, 'name', 'name():(string)').returns([ethereum.Value.fromString(token.name)])
  createMockedFunction(tokenAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token.totalSupply)),
  ])
  createMockedFunction(tokenAddress, 'decimals', 'decimals():(uint32)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token.decimals)),
  ])
}

export function createAndStoreTestToken(tokenFixture: TokenFixture): Token {
  const token = new Token(tokenFixture.address)
  token.symbol = tokenFixture.symbol
  token.name = tokenFixture.name
  token.decimals = BigInt.fromString(tokenFixture.decimals)
  token.save()
  return token
}

// Typescript for Subgraphs do not support Record types so we use a 2D string array to represent the object instead.
export function assertObjectMatches(entityType: string, id: string, obj: string[][]): void {
  for (let i = 0; i < obj.length; i++) {
    assert.fieldEquals(entityType, id, obj[i][0], obj[i][1])
  }
}
