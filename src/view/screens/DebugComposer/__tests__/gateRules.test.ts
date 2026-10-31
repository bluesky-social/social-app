import {describe, expect, test} from '@jest/globals'

import {
  mergePostgateEmbeddingRules,
  mergeThreadgateAllowRules,
  splitPostgateEmbeddingRules,
  splitThreadgateAllowRules,
} from '#/view/screens/DebugComposer/gateRules'
import {
  type PostgateEmbeddingRule,
  type ThreadgateAllowRule,
} from '#/components/ComposerV2/store/types'

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
    expect(splitThreadgateAllowRules({rules: undefined})).toEqual({
      settings: [{type: 'everybody'}],
      unknownRules: [],
    })
    expect(splitThreadgateAllowRules({rules: []})).toEqual({
      settings: [{type: 'nobody'}],
      unknownRules: [],
    })
  })

  test('separates known settings from unknown rules', () => {
    const {settings, unknownRules} = splitThreadgateAllowRules({
      rules: [mentionRule, unknownAllowRule, listRule],
    })
    expect(settings).toEqual([
      {type: 'mention'},
      {type: 'list', list: 'at://did:plc:abc/app.bsky.graph.list/xyz'},
    ])
    expect(unknownRules).toEqual([unknownAllowRule])
  })
})

describe('mergeThreadgateAllowRules', () => {
  test('keeps unknown rules alongside edited known settings', () => {
    const merged = mergeThreadgateAllowRules({
      settings: [{type: 'followers'}],
      unknownRules: [unknownAllowRule],
    })
    expect(merged).toEqual([followerRule, unknownAllowRule])
  })

  test('everybody stays everybody only without unknown rules', () => {
    expect(
      mergeThreadgateAllowRules({
        settings: [{type: 'everybody'}],
        unknownRules: [],
      }),
    ).toBe(undefined)
    /* Unknown rules restrict replies; "everybody" must not silently drop
     * them and broaden permissions. */
    expect(
      mergeThreadgateAllowRules({
        settings: [{type: 'everybody'}],
        unknownRules: [unknownAllowRule],
      }),
    ).toEqual([unknownAllowRule])
  })

  test('nobody is an explicit narrowing edit and wins over unknown rules', () => {
    expect(
      mergeThreadgateAllowRules({
        settings: [{type: 'nobody'}],
        unknownRules: [unknownAllowRule],
      }),
    ).toEqual([])
  })

  test('round-trips through split without changing the rule set', () => {
    const original = [mentionRule, listRule, unknownAllowRule]
    const {settings, unknownRules} = splitThreadgateAllowRules({
      rules: original,
    })
    expect(mergeThreadgateAllowRules({settings, unknownRules})).toEqual(
      original,
    )
  })
})

describe('postgate embedding rules', () => {
  test('split reports the quote toggle and unknown rules', () => {
    expect(splitPostgateEmbeddingRules({rules: []})).toEqual({
      quotesEnabled: true,
      unknownRules: [],
    })
    expect(
      splitPostgateEmbeddingRules({rules: [disableRule, unknownEmbeddingRule]}),
    ).toEqual({
      quotesEnabled: false,
      unknownRules: [unknownEmbeddingRule],
    })
  })

  test('merge always preserves unknown restrictions', () => {
    expect(
      mergePostgateEmbeddingRules({
        quotesEnabled: true,
        unknownRules: [unknownEmbeddingRule],
      }),
    ).toEqual([unknownEmbeddingRule])
    expect(
      mergePostgateEmbeddingRules({
        quotesEnabled: false,
        unknownRules: [unknownEmbeddingRule],
      }),
    ).toEqual([disableRule, unknownEmbeddingRule])
  })

  test('round-trips through split without changing the rule set', () => {
    const original = [disableRule, unknownEmbeddingRule]
    const {quotesEnabled, unknownRules} = splitPostgateEmbeddingRules({
      rules: original,
    })
    expect(mergePostgateEmbeddingRules({quotesEnabled, unknownRules})).toEqual(
      original,
    )
  })
})
