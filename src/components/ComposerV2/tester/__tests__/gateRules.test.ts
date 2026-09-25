import {describe, expect, test} from '@jest/globals'

import {
  type PostgateEmbeddingRule,
  type ThreadgateAllowRule,
} from '#/components/ComposerV2/store/types'
import {
  mergePostgateEmbeddingRules,
  mergeThreadgateAllowRules,
  splitPostgateEmbeddingRules,
  splitThreadgateAllowRules,
} from '#/components/ComposerV2/tester/gateRules'

const mentionRule = {
  $type: 'app.bsky.feed.threadgate#mentionRule',
} as ThreadgateAllowRule
const followerRule = {
  $type: 'app.bsky.feed.threadgate#followerRule',
} as ThreadgateAllowRule
const listRule = {
  $type: 'app.bsky.feed.threadgate#listRule',
  list: 'at://did:plc:abc/app.bsky.graph.list/xyz',
} as ThreadgateAllowRule
const unknownAllowRule = {
  $type: 'app.bsky.feed.threadgate#futureRule',
  nested: {enabled: true},
} as unknown as ThreadgateAllowRule

const disableRule = {
  $type: 'app.bsky.feed.postgate#disableRule',
} as PostgateEmbeddingRule
const unknownEmbeddingRule = {
  $type: 'app.bsky.feed.postgate#futureRule',
} as unknown as PostgateEmbeddingRule

describe('splitThreadgateAllowRules', () => {
  test('maps undefined to everybody and empty to nobody', () => {
    expect(splitThreadgateAllowRules(undefined)).toEqual({
      settings: [{type: 'everybody'}],
      unknownRules: [],
    })
    expect(splitThreadgateAllowRules([])).toEqual({
      settings: [{type: 'nobody'}],
      unknownRules: [],
    })
  })

  test('separates known settings from unknown rules', () => {
    const {settings, unknownRules} = splitThreadgateAllowRules([
      mentionRule,
      unknownAllowRule,
      listRule,
    ])
    expect(settings).toEqual([
      {type: 'mention'},
      {type: 'list', list: 'at://did:plc:abc/app.bsky.graph.list/xyz'},
    ])
    expect(unknownRules).toEqual([unknownAllowRule])
  })
})

describe('mergeThreadgateAllowRules', () => {
  test('keeps unknown rules alongside edited known settings', () => {
    const merged = mergeThreadgateAllowRules(
      [{type: 'followers'}],
      [unknownAllowRule],
    )
    expect(merged).toEqual([followerRule, unknownAllowRule])
  })

  test('everybody stays everybody only without unknown rules', () => {
    expect(mergeThreadgateAllowRules([{type: 'everybody'}], [])).toBe(undefined)
    /* Unknown rules restrict replies; "everybody" must not silently drop
     * them and broaden permissions. */
    expect(
      mergeThreadgateAllowRules([{type: 'everybody'}], [unknownAllowRule]),
    ).toEqual([unknownAllowRule])
  })

  test('nobody is an explicit narrowing edit and wins over unknown rules', () => {
    expect(
      mergeThreadgateAllowRules([{type: 'nobody'}], [unknownAllowRule]),
    ).toEqual([])
  })

  test('round-trips through split without changing the rule set', () => {
    const original = [mentionRule, listRule, unknownAllowRule]
    const {settings, unknownRules} = splitThreadgateAllowRules(original)
    expect(mergeThreadgateAllowRules(settings, unknownRules)).toEqual(original)
  })
})

describe('postgate embedding rules', () => {
  test('split reports the quote toggle and unknown rules', () => {
    expect(splitPostgateEmbeddingRules([])).toEqual({
      quotesEnabled: true,
      unknownRules: [],
    })
    expect(
      splitPostgateEmbeddingRules([disableRule, unknownEmbeddingRule]),
    ).toEqual({
      quotesEnabled: false,
      unknownRules: [unknownEmbeddingRule],
    })
  })

  test('merge always preserves unknown restrictions', () => {
    expect(mergePostgateEmbeddingRules(true, [unknownEmbeddingRule])).toEqual([
      unknownEmbeddingRule,
    ])
    expect(mergePostgateEmbeddingRules(false, [unknownEmbeddingRule])).toEqual([
      disableRule,
      unknownEmbeddingRule,
    ])
  })

  test('round-trips through split without changing the rule set', () => {
    const original = [disableRule, unknownEmbeddingRule]
    const {quotesEnabled, unknownRules} = splitPostgateEmbeddingRules(original)
    expect(mergePostgateEmbeddingRules(quotesEnabled, unknownRules)).toEqual(
      original,
    )
  })
})
