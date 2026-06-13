import {type ThreadItem} from '#/state/queries/usePostThread/types'
import {
  buildReaderThread,
  type ReaderSegmentItem,
  type ThreadPostItem,
} from '../reader'

const OP_DID = 'did:plc:op'

function post({
  rkey,
  depth,
  did = OP_DID,
  opThread = false,
  moreReplies = 0,
  replyCount = 0,
}: {
  rkey: string
  depth: number
  did?: string
  opThread?: boolean
  moreReplies?: number
  replyCount?: number
}): ThreadPostItem {
  const uri = `at://${did}/app.bsky.feed.post/${rkey}`
  return {
    type: 'threadPost',
    key: uri,
    uri,
    depth,
    value: {
      post: {
        uri,
        author: {did, handle: 'user.test'},
        record: {},
        replyCount,
      },
      opThread,
      moreReplies,
    },
    isBlurred: false,
    moderation: {},
    ui: {
      isAnchor: depth === 0,
      showParentReplyLine: depth > 0,
      showChildReplyLine: false,
      indent: depth,
      isLastChild: false,
      skippedIndentIndices: new Set<number>(),
      precedesChildReadMore: false,
    },
  } as unknown as ThreadPostItem
}

const composer: ThreadItem = {type: 'replyComposer', key: 'replyComposer'}

const NO_SEAMS = {expandedSeamUri: null}

const segmentsOf = (items: ReturnType<typeof buildReaderThread>['items']) =>
  items.filter((i): i is ReaderSegmentItem => i.type === 'readerSegment')

describe('buildReaderThread', () => {
  it('collapses an OP chain into segments with seams', () => {
    const anchor = post({rkey: 'a', depth: 0, replyCount: 4})
    const one = post({
      rkey: 'b',
      depth: 1,
      opThread: true,
      moreReplies: 3,
      replyCount: 4,
    })
    const two = post({rkey: 'c', depth: 2, opThread: true, replyCount: 2})
    const {items, anchorSeam, expandedSeam} = buildReaderThread(
      [anchor, composer, one, two],
      NO_SEAMS,
    )

    expect(items.map(i => i.type)).toEqual([
      'threadPost',
      'readerSegment',
      'readerSegment',
    ])

    const segments = segmentsOf(items)
    expect(segments[0].item).toBe(one)
    // mid-chain seams count only replies missing from the response
    expect(segments[0].seam.expanded).toBe(false)
    expect(segments[0].seam.hiddenReplyCount).toBe(3)
    expect(segments[0].seam.continuationUri).toBe(two.uri)
    // the last seam counts all replies, since none render below it
    expect(segments[1].item).toBe(two)
    expect(segments[1].seam.hiddenReplyCount).toBe(2)
    expect(segments[1].seam.continuationUri).toBe('')

    // the anchor seam counts all of its replies and continues into the chain
    expect(anchorSeam).toBeDefined()
    expect(anchorSeam?.expanded).toBe(false)
    expect(anchorSeam?.hiddenReplyCount).toBe(4)
    expect(anchorSeam?.continuationUri).toBe(one.uri)

    expect(expandedSeam).toBeUndefined()
  })

  it('returns input unchanged when there is no OP chain', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const reply = post({rkey: 'b', depth: 1, did: 'did:plc:other'})
    const input = [anchor, composer, reply]
    const {items, anchorSeam, expandedSeam} = buildReaderThread(input, NO_SEAMS)

    expect(anchorSeam).toBeUndefined()
    expect(expandedSeam).toBeUndefined()
    expect(items).toBe(input)
  })

  it('re-inserts the composer when the last seam is expanded', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const two = post({rkey: 'c', depth: 2, opThread: true})
    const {items} = buildReaderThread([anchor, composer, one, two], {
      expandedSeamUri: two.uri,
    })

    expect(items.map(i => i.type)).toEqual([
      'threadPost',
      'readerSegment',
      'readerSegment',
      'replyComposer',
    ])
  })

  it('ends the chain when the author changes', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const interloper = post({
      rkey: 'c',
      depth: 2,
      did: 'did:plc:other',
      opThread: true,
    })
    const {items} = buildReaderThread([anchor, one, interloper], NO_SEAMS)

    // the interloper is dropped: it is reachable via the last seam
    expect(items.map(i => i.type)).toEqual(['threadPost', 'readerSegment'])
  })

  it('ends the chain when opThread is false', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const selfReplyOffThread = post({rkey: 'c', depth: 2, opThread: false})
    const {items} = buildReaderThread(
      [anchor, one, selfReplyOffThread],
      NO_SEAMS,
    )

    expect(items.map(i => i.type)).toEqual(['threadPost', 'readerSegment'])
  })

  it('marks the expanded seam from the expanded uri', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const two = post({rkey: 'c', depth: 2, opThread: true})
    const three = post({rkey: 'd', depth: 3, opThread: true})
    const {items, anchorSeam, expandedSeam} = buildReaderThread(
      [anchor, one, two, three],
      {expandedSeamUri: two.uri},
    )

    const segments = segmentsOf(items)
    expect(segments.map(s => s.seam.expanded)).toEqual([false, true, false])
    expect(anchorSeam?.expanded).toBe(false)
    expect(expandedSeam).toBe(segments[1].seam)
  })

  it('keeps a trailing read more with the chain', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const readMore: ThreadItem = {
      type: 'readMore',
      key: `readMore:${one.uri}`,
      depth: 2,
      href: '/x',
      moreReplies: 5,
      skippedIndentIndices: new Set(),
    }
    const reply = post({rkey: 'd', depth: 1, did: 'did:plc:other'})
    const {items} = buildReaderThread(
      [anchor, composer, one, readMore, reply],
      NO_SEAMS,
    )

    expect(items.map(i => i.type)).toEqual([
      'threadPost',
      'readerSegment',
      'readMore',
    ])
  })

  it('drops sibling replies even when the chain is not the first sibling', () => {
    const anchor = post({rkey: 'a', depth: 0})
    const otherReply = post({rkey: 'b', depth: 1, did: 'did:plc:other'})
    const one = post({rkey: 'c', depth: 1, opThread: true})
    const two = post({rkey: 'd', depth: 2, opThread: true})
    const {items, anchorSeam} = buildReaderThread(
      [anchor, composer, otherReply, one, two],
      NO_SEAMS,
    )

    // otherReply is dropped: it is reachable via the anchor's seam
    expect(items.map(i => i.type)).toEqual([
      'threadPost',
      'readerSegment',
      'readerSegment',
    ])
    expect(segmentsOf(items)[0].item).toBe(one)
    expect(anchorSeam?.continuationUri).toBe(one.uri)
  })

  it('passes through items above the anchor unchanged', () => {
    const parent = post({rkey: 'p', depth: -1})
    const anchor = post({rkey: 'a', depth: 0})
    const one = post({rkey: 'b', depth: 1, opThread: true})
    const {items} = buildReaderThread([parent, anchor, one], NO_SEAMS)

    expect(items[0]).toBe(parent)
    expect(items[1]).toBe(anchor)
  })
})
