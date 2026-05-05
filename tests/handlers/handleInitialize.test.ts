import { assert, clearStore, describe, test } from 'matchstick-as'

import { handleInitializeHelper } from '../../src/mappings/poolManager'
import {
  ADDRESS_ZERO,
  assertObjectMatches,
  createAndStoreTestToken,
  createInitializeEvent,
  MOCK_EVENT,
  mockTokenCalls,
  TEST_CONFIG,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_POOL_ID,
  WETH_MAINNET_FIXTURE,
} from './constants'

describe('handleInitialize', () => {
  test('creates pool and token entities required by pool queries', () => {
    clearStore()
    mockTokenCalls(USDC_MAINNET_FIXTURE)
    mockTokenCalls(WETH_MAINNET_FIXTURE)

    handleInitializeHelper(createInitializeEvent(), TEST_CONFIG)

    assertObjectMatches('Pool', USDC_WETH_POOL_ID, [
      ['token0', USDC_MAINNET_FIXTURE.address],
      ['token1', WETH_MAINNET_FIXTURE.address],
      ['feeTier', '500'],
      ['tickSpacing', '10'],
      ['hooks', ADDRESS_ZERO],
      ['createdAtBlockNumber', MOCK_EVENT.block.number.toString()],
    ])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [
      ['symbol', USDC_MAINNET_FIXTURE.symbol],
      ['name', USDC_MAINNET_FIXTURE.name],
      ['decimals', USDC_MAINNET_FIXTURE.decimals],
    ])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [
      ['symbol', WETH_MAINNET_FIXTURE.symbol],
      ['name', WETH_MAINNET_FIXTURE.name],
      ['decimals', WETH_MAINNET_FIXTURE.decimals],
    ])
  })

  test('reuses existing tokens', () => {
    clearStore()
    createAndStoreTestToken(USDC_MAINNET_FIXTURE)
    createAndStoreTestToken(WETH_MAINNET_FIXTURE)

    handleInitializeHelper(createInitializeEvent(), TEST_CONFIG)

    assertObjectMatches('Pool', USDC_WETH_POOL_ID, [
      ['token0', USDC_MAINNET_FIXTURE.address],
      ['token1', WETH_MAINNET_FIXTURE.address],
    ])
  })

  test('skips configured pool ids', () => {
    clearStore()
    const config = TEST_CONFIG
    config.poolsToSkip = [USDC_WETH_POOL_ID]

    handleInitializeHelper(createInitializeEvent(), config)

    assert.notInStore('Pool', USDC_WETH_POOL_ID)
    config.poolsToSkip = []
  })
})
