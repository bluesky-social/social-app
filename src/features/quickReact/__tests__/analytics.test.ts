import {describe, expect, jest, test} from '@jest/globals'

import {
  hashPostUri,
  logBarOpen,
  logRemove,
  logSelect,
} from '#/features/quickReact/analytics'

function makeSink() {
  const metric = jest.fn()
  return {metric, sink: {metric} as any}
}

describe('quickReact analytics', () => {
  test('barOpen event payload contains uriHash (not raw URI), surface, entryPoint, flagVariant, logContext', () => {
    const {metric, sink} = makeSink()
    const postUri = 'at://did:plc:abc/app.bsky.feed.post/1'
    logBarOpen(sink, {
      postUri,
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
    })
    expect(metric).toHaveBeenCalledWith('quickReaction:barOpen', {
      uriHash: hashPostUri(postUri),
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
    })
    const call = metric.mock.calls[0]
    expect(JSON.stringify(call)).not.toContain(postUri)
  })

  test('select event payload contains uriHash, emoji, surface, flagVariant, logContext, isChange', () => {
    const {metric, sink} = makeSink()
    logSelect(sink, {
      postUri: 'at://x',
      emoji: 'fire',
      surface: 'thread',
      entryPoint: 'a11yAction',
      flagVariant: 'on',
      logContext: 'PostThreadItem',
      isChange: true,
      previousEmoji: 'heart',
    })
    expect(metric).toHaveBeenCalledWith('quickReaction:select', {
      uriHash: hashPostUri('at://x'),
      emoji: 'fire',
      surface: 'thread',
      entryPoint: 'a11yAction',
      flagVariant: 'on',
      logContext: 'PostThreadItem',
      isChange: true,
      previousEmoji: 'heart',
    })
  })

  test('remove event payload contains uriHash, previousEmoji, removalMethod', () => {
    const {metric, sink} = makeSink()
    logRemove(sink, {
      postUri: 'at://x',
      previousEmoji: 'joy',
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
      removalMethod: 'retapSelected',
    })
    const payload = metric.mock.calls[0][1] as any
    expect(payload).toMatchObject({
      previousEmoji: 'joy',
      removalMethod: 'retapSelected',
    })
    expect(payload.uriHash).toMatch(/^[0-9a-f]{16}$/)
  })

  test('raw postUri never appears in any emitted payload', () => {
    const {metric, sink} = makeSink()
    const postUri = 'at://did:plc:secret/app.bsky.feed.post/xyz'
    logBarOpen(sink, {
      postUri,
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
    })
    logSelect(sink, {
      postUri,
      emoji: 'heart',
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
      isChange: false,
    })
    logRemove(sink, {
      postUri,
      previousEmoji: 'heart',
      surface: 'feed',
      entryPoint: 'longPress',
      flagVariant: 'on',
      logContext: 'FeedItem',
      removalMethod: 'retapSelected',
    })
    for (const call of metric.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(postUri)
      expect(JSON.stringify(call)).not.toContain('did:plc:secret')
    }
  })
})
