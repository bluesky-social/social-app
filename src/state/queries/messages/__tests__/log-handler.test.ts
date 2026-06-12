import {type ChatBskyConvoDefs} from '@atproto/api'
import {QueryClient} from '@tanstack/react-query'

import {RQKEY as CONVO_KEY} from '../conversation'
import {
  type ConvoRequestListQueryData,
  RQKEY as REQUESTS_RQKEY,
} from '../list-conversation-requests'
import {type ConvoListQueryData, RQKEY} from '../list-conversations'
import {listConvoMembersQueryKey} from '../list-convo-members'
import {handleConvoLogEvents} from '../log-handler'
import {makeConvo, makeLog, makeMessageView, makeProfile, rev} from './fixtures'

const ME = 'did:plc:me'
const OTHER = 'did:plc:other'

// ---------------------------------------------------------------------------
// Seed helpers - keep the tests readable. All build real QueryClient caches.
// ---------------------------------------------------------------------------

type ListKey = ReturnType<typeof RQKEY>

function seedList(
  qc: QueryClient,
  key: ListKey,
  pages: ChatBskyConvoDefs.ConvoView[][],
) {
  const data: ConvoListQueryData = {
    pageParams: pages.map(() => undefined),
    pages: pages.map(convos => ({convos, cursor: undefined})),
  }
  qc.setQueryData(key, data)
}

/**
 * Build a query entry that exists but has undefined data. setQueriesData only
 * touches existing entries, so this is needed to exercise the createMessage
 * "fabricate a single-page cache" seed branch.
 */
function seedEmptyQuery(qc: QueryClient, key: ListKey) {
  qc.getQueryCache().build(qc, {queryKey: key})
}

function seedRequestsInbox(
  qc: QueryClient,
  convos: ChatBskyConvoDefs.ConvoView[],
) {
  const data: ConvoRequestListQueryData = {
    pageParams: [undefined],
    pages: [
      {
        requests: convos.map(c => ({
          ...c,
          $type: 'chat.bsky.convo.defs#convoView' as const,
        })),
        cursor: undefined,
      },
    ],
  }
  qc.setQueryData(REQUESTS_RQKEY(), data)
}

function getList(qc: QueryClient, key: ListKey) {
  return qc.getQueryData<ConvoListQueryData>(key)
}

function findConvo(data: ConvoListQueryData | undefined, id: string) {
  if (!data) return undefined
  for (const page of data.pages) {
    const found = page.convos.find(c => c.id === id)
    if (found) return found
  }
  return undefined
}

function getRequestsConvoIds(qc: QueryClient): string[] {
  const data = qc.getQueryData<ConvoRequestListQueryData>(REQUESTS_RQKEY())
  if (!data) return []
  return data.pages.flatMap(p =>
    p.requests
      .filter(
        (r): r is ChatBskyConvoDefs.ConvoView & {$type: string} =>
          (r as {$type?: string}).$type === 'chat.bsky.convo.defs#convoView',
      )
      .map(r => r.id),
  )
}

function call(
  qc: QueryClient,
  logs: Parameters<typeof handleConvoLogEvents>[0]['logs'],
  opts: {
    currentConvoId?: string
    currentAccountDid?: string
    onRefetchNeeded?: () => void
  } = {},
) {
  const onRefetchNeeded = opts.onRefetchNeeded ?? jest.fn()
  handleConvoLogEvents({
    queryClient: qc,
    logs,
    currentConvoId: opts.currentConvoId,
    currentAccountDid: opts.currentAccountDid ?? ME,
    onRefetchNeeded,
  })
  return onRefetchNeeded
}

// ===========================================================================
// 1. Batch continuation - the "return instead of continue" regression
// ===========================================================================

describe('batch continuation (continue, not return)', () => {
  it('applies a later mute after an unknown-convo createMessage in the same batch', () => {
    const qc = new QueryClient()
    const known = makeConvo({id: 'known', rev: rev(1), muted: false})
    const key = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedList(qc, key, [[known]])

    const onRefetchNeeded = call(
      qc,
      [
        // unknown convo - triggers refetch + continue (previously: return)
        makeLog.createMessage(
          'unknown',
          rev(5),
          makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
        ),
        // known convo - must still apply despite the earlier miss
        makeLog.muteConvo('known', rev(5)),
      ],
      {currentAccountDid: ME},
    )

    expect(findConvo(getList(qc, key), 'known')?.muted).toBe(true)
    expect(onRefetchNeeded).toHaveBeenCalled()
  })

  it('applies a later log after an unknown-convo acceptConvo in the same batch', () => {
    const qc = new QueryClient()
    const known = makeConvo({id: 'known', rev: rev(1), muted: false})
    const key = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedList(qc, key, [[known]])

    const onRefetchNeeded = call(qc, [
      // unknown convo in request caches - triggers refetch + continue
      makeLog.acceptConvo('unknown', rev(5)),
      makeLog.muteConvo('known', rev(5)),
    ])

    expect(findConvo(getList(qc, key), 'known')?.muted).toBe(true)
    expect(onRefetchNeeded).toHaveBeenCalled()
  })
})

// ===========================================================================
// 2. Accept updates 'all'-status caches + resurrect prevention
// ===========================================================================

describe('logAcceptConvo across caches', () => {
  function setup() {
    const qc = new QueryClient()
    const requestConvo = makeConvo({
      id: 'c',
      rev: rev(1),
      status: 'request',
      unreadCount: 1,
    })
    const allUnreadKey = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    const requestKey = RQKEY('request', 'all', 'all', undefined, 10)
    const acceptedKey = RQKEY('accepted', 'all', 'all', undefined, 10)

    seedList(qc, allUnreadKey, [[requestConvo]])
    seedList(qc, requestKey, [[requestConvo]])
    seedList(qc, acceptedKey, [[]])
    seedRequestsInbox(qc, [requestConvo])

    return {qc, allUnreadKey, requestKey, acceptedKey}
  }

  it('flips status in all-cache, drops from request caches, adds to accepted, drops from inbox', () => {
    const {qc, allUnreadKey, requestKey, acceptedKey} = setup()

    call(qc, [makeLog.acceptConvo('c', rev(5))])

    // 'all' copy now accepted
    expect(findConvo(getList(qc, allUnreadKey), 'c')?.status).toBe('accepted')
    // 'request'-status list no longer contains it
    expect(findConvo(getList(qc, requestKey), 'c')).toBeUndefined()
    // 'accepted'-status list gained it at the top of page 0
    expect(getList(qc, acceptedKey)?.pages[0].convos[0]?.id).toBe('c')
    expect(findConvo(getList(qc, acceptedKey), 'c')?.status).toBe('accepted')
    // requests inbox dropped it
    expect(getRequestsConvoIds(qc)).not.toContain('c')
  })

  it('does not resurrect the convo in request caches when a later createMessage arrives', () => {
    const {qc, allUnreadKey, requestKey, acceptedKey} = setup()

    call(qc, [
      makeLog.acceptConvo('c', rev(5)),
      makeLog.createMessage(
        'c',
        rev(6),
        makeMessageView({senderDid: OTHER, id: 'm2', rev: rev(6)}),
      ),
    ])

    // still not in request-status list or inbox
    expect(findConvo(getList(qc, requestKey), 'c')).toBeUndefined()
    expect(getRequestsConvoIds(qc)).not.toContain('c')
    // updated in 'all' and 'accepted' caches, with accepted status
    expect(findConvo(getList(qc, allUnreadKey), 'c')?.status).toBe('accepted')
    expect(findConvo(getList(qc, acceptedKey), 'c')?.status).toBe('accepted')
  })
})

// ===========================================================================
// 3. Rev guard
// ===========================================================================

describe('rev guard', () => {
  it('ignores a stale logReadConvo (rev <= cached rev)', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(5), unreadCount: 3})
    const key = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedList(qc, key, [[convo]])

    call(qc, [
      makeLog.readConvo(
        'c',
        rev(5), // equal - guard skips
        makeMessageView({senderDid: OTHER}),
      ),
    ])

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(3)
    expect(findConvo(getList(qc, key), 'c')?.rev).toBe(rev(5))
  })

  it('ignores a replayed logCreateMessage (rev <= cached rev), no double-bump', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(5), unreadCount: 1})
    const key = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedList(qc, key, [[convo]])

    call(qc, [
      makeLog.createMessage(
        'c',
        rev(5), // not newer - skip
        makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
      ),
    ])

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(1)
  })

  it('applies a newer logReadConvo and stamps the new rev', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(5), unreadCount: 3})
    const key = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedList(qc, key, [[convo]])

    call(qc, [
      makeLog.readConvo('c', rev(9), makeMessageView({senderDid: OTHER})),
    ])

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(0)
    expect(findConvo(getList(qc, key), 'c')?.rev).toBe(rev(9))
  })
})

// ===========================================================================
// 4. Core behaviors
// ===========================================================================

describe('logCreateMessage core behavior', () => {
  it('updates lastMessage, moves to top of page 0, removes from later pages', () => {
    const qc = new QueryClient()
    const target = makeConvo({id: 'c', rev: rev(1), unreadCount: 0})
    const other = makeConvo({id: 'd', rev: rev(1)})
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    // target sits on page 1 (not page 0) and another convo is on page 0
    seedList(qc, key, [[other], [target]])

    const newMsg = makeMessageView({
      senderDid: OTHER,
      id: 'm-new',
      rev: rev(5),
      text: 'newest',
    })
    call(qc, [makeLog.createMessage('c', rev(5), newMsg)])

    const data = getList(qc, key)
    // moved to top of page 0
    expect(data?.pages[0].convos[0]?.id).toBe('c')
    // removed from page 1
    expect(data?.pages[1].convos.find(c => c.id === 'c')).toBeUndefined()
    // lastMessage updated
    const updated = findConvo(data, 'c')
    expect((updated?.lastMessage as ChatBskyConvoDefs.MessageView)?.text).toBe(
      'newest',
    )
  })

  it('increments unreadCount when message is from someone else and not the current convo', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(1), unreadCount: 2})
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[convo]])

    call(
      qc,
      [
        makeLog.createMessage(
          'c',
          rev(5),
          makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
        ),
      ],
      {currentConvoId: undefined, currentAccountDid: ME},
    )

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(3)
  })

  it('does not increment unreadCount for own message', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(1), unreadCount: 2})
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[convo]])

    call(
      qc,
      [
        makeLog.createMessage(
          'c',
          rev(5),
          makeMessageView({senderDid: ME, id: 'm', rev: rev(5)}),
        ),
      ],
      {currentAccountDid: ME},
    )

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(2)
  })

  it('forces unreadCount to 0 when the convo is the current convo', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(1), unreadCount: 4})
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[convo]])

    call(
      qc,
      [
        makeLog.createMessage(
          'c',
          rev(5),
          makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
        ),
      ],
      {currentConvoId: 'c', currentAccountDid: ME},
    )

    expect(findConvo(getList(qc, key), 'c')?.unreadCount).toBe(0)
  })

  it('seeds a fabricated single-page cache for an existing-but-empty all+unread query', () => {
    const qc = new QueryClient()
    const convo = makeConvo({id: 'c', rev: rev(1), unreadCount: 0})
    // The convo must be found somewhere, else the handler bails with refetch.
    const acceptedKey = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, acceptedKey, [[convo]])

    // all+unread query exists but has no data yet
    const allUnreadKey = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    seedEmptyQuery(qc, allUnreadKey)

    call(qc, [
      makeLog.createMessage(
        'c',
        rev(5),
        makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
      ),
    ])

    // NOTE: pins current behavior - the empty all+unread query is seeded with a
    // fabricated single page containing just the updated convo (with the bumped
    // unreadCount), rather than left undefined.
    const seeded = getList(qc, allUnreadKey)
    expect(seeded?.pages).toHaveLength(1)
    expect(seeded?.pages[0].convos).toHaveLength(1)
    expect(seeded?.pages[0].convos[0]?.id).toBe('c')
    expect(seeded?.pages[0].convos[0]?.unreadCount).toBe(1)
  })
})

describe('logReadConvo', () => {
  it('zeroes unreadCount across multiple list caches', () => {
    const qc = new QueryClient()
    const a = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    const b = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, a, [[makeConvo({id: 'c', rev: rev(1), unreadCount: 3})]])
    seedList(qc, b, [[makeConvo({id: 'c', rev: rev(1), unreadCount: 3})]])

    call(qc, [
      makeLog.readConvo('c', rev(5), makeMessageView({senderDid: OTHER})),
    ])

    expect(findConvo(getList(qc, a), 'c')?.unreadCount).toBe(0)
    expect(findConvo(getList(qc, b), 'c')?.unreadCount).toBe(0)
  })
})

describe('mute / unmute', () => {
  it('logMuteConvo sets muted on list caches and the single-convo cache', () => {
    const qc = new QueryClient()
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[makeConvo({id: 'c', rev: rev(1), muted: false})]])
    qc.setQueryData(
      CONVO_KEY('c'),
      makeConvo({id: 'c', rev: rev(1), muted: false}),
    )

    call(qc, [makeLog.muteConvo('c', rev(5))])

    expect(findConvo(getList(qc, key), 'c')?.muted).toBe(true)
    expect(
      qc.getQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY('c'))?.muted,
    ).toBe(true)
  })

  it('logUnmuteConvo clears muted on list caches and the single-convo cache', () => {
    const qc = new QueryClient()
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[makeConvo({id: 'c', rev: rev(1), muted: true})]])
    qc.setQueryData(
      CONVO_KEY('c'),
      makeConvo({id: 'c', rev: rev(1), muted: true}),
    )

    call(qc, [makeLog.unmuteConvo('c', rev(5))])

    expect(findConvo(getList(qc, key), 'c')?.muted).toBe(false)
    expect(
      qc.getQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY('c'))?.muted,
    ).toBe(false)
  })
})

describe('logLeaveConvo', () => {
  it('removes the convo from all list caches and the requests inbox', () => {
    const qc = new QueryClient()
    const a = RQKEY('all', 'unread', 'all', 'unlocked', 20)
    const b = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, a, [[makeConvo({id: 'c', rev: rev(1)})]])
    seedList(qc, b, [[makeConvo({id: 'c', rev: rev(1)})]])
    seedRequestsInbox(qc, [
      makeConvo({id: 'c', rev: rev(1), status: 'request'}),
    ])

    call(qc, [makeLog.leaveConvo('c', rev(5))])

    expect(findConvo(getList(qc, a), 'c')).toBeUndefined()
    expect(findConvo(getList(qc, b), 'c')).toBeUndefined()
    expect(getRequestsConvoIds(qc)).not.toContain('c')
  })
})

describe('logCreateMessage for a request convo', () => {
  it('moves the convo to the top of the requests inbox', () => {
    const qc = new QueryClient()
    const reqA = makeConvo({id: 'a', rev: rev(1), status: 'request'})
    const reqB = makeConvo({id: 'b', rev: rev(1), status: 'request'})
    // request convos must be found in a request-status list for foundConvo
    const requestKey = RQKEY('request', 'all', 'all', undefined, 10)
    seedList(qc, requestKey, [[reqA, reqB]])
    seedRequestsInbox(qc, [reqA, reqB])

    call(qc, [
      makeLog.createMessage(
        'b',
        rev(5),
        makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
      ),
    ])

    // 'b' moved to the top of the requests inbox
    expect(getRequestsConvoIds(qc)[0]).toBe('b')
  })
})

describe('member add (logAddMember)', () => {
  it('bumps memberCount on a group convo and appends to the members cache', () => {
    const qc = new QueryClient()
    const group = makeConvo({
      id: 'g',
      rev: rev(1),
      kind: 'group',
      groupKind: {memberCount: 3},
    })
    const key = RQKEY('accepted', 'all', 'group', 'unlocked', 10)
    seedList(qc, key, [[group]])
    // members cache exists without the new member
    qc.setQueryData(listConvoMembersQueryKey('g'), [
      makeProfile(ME),
      makeProfile(OTHER),
    ])

    const newProfile = makeProfile('did:plc:newbie')
    call(qc, [makeLog.addMember('g', rev(5), 'did:plc:newbie', [newProfile])])

    const convo = findConvo(getList(qc, key), 'g')
    expect((convo?.kind as ChatBskyConvoDefs.GroupConvo).memberCount).toBe(4)
    const members = qc.getQueryData<ReturnType<typeof makeProfile>[]>(
      listConvoMembersQueryKey('g'),
    )
    expect(members?.some(m => m.did === 'did:plc:newbie')).toBe(true)
  })

  it('does not double-bump when the member is already in the members cache', () => {
    const qc = new QueryClient()
    const group = makeConvo({
      id: 'g',
      rev: rev(1),
      kind: 'group',
      groupKind: {memberCount: 3},
    })
    const key = RQKEY('accepted', 'all', 'group', 'unlocked', 10)
    seedList(qc, key, [[group]])
    // newbie already present in the members cache (optimistic add)
    qc.setQueryData(listConvoMembersQueryKey('g'), [
      makeProfile(ME),
      makeProfile(OTHER),
      makeProfile('did:plc:newbie'),
    ])

    const newProfile = makeProfile('did:plc:newbie')
    call(qc, [makeLog.addMember('g', rev(5), 'did:plc:newbie', [newProfile])])

    const convo = findConvo(getList(qc, key), 'g')
    // count unchanged - dedup guard
    expect((convo?.kind as ChatBskyConvoDefs.GroupConvo).memberCount).toBe(3)
  })

  it('leaves a direct convo unchanged on member add', () => {
    const qc = new QueryClient()
    const direct = makeConvo({id: 'd', rev: rev(1), kind: 'direct'})
    const key = RQKEY('accepted', 'all', 'direct', undefined, 10)
    seedList(qc, key, [[direct]])
    qc.setQueryData(listConvoMembersQueryKey('d'), [
      makeProfile(ME),
      makeProfile(OTHER),
    ])

    const newProfile = makeProfile('did:plc:newbie')
    call(qc, [makeLog.addMember('d', rev(5), 'did:plc:newbie', [newProfile])])

    const convo = findConvo(getList(qc, key), 'd')
    // direct convo kind has no memberCount; the addMemberToConvoView helper
    // returns the convo unchanged for non-group kinds.
    expect(convo?.kind?.$type).toBe('chat.bsky.convo.defs#directConvo')
    expect(
      (convo as ChatBskyConvoDefs.ConvoView & {kind: {memberCount?: number}})
        .kind.memberCount,
    ).toBeUndefined()
  })
})

// ===========================================================================
// 5. onRefetchNeeded
// ===========================================================================

describe('onRefetchNeeded', () => {
  it('is called for logBeginConvo', () => {
    const qc = new QueryClient()
    const onRefetchNeeded = call(qc, [makeLog.beginConvo('c', rev(5))])
    expect(onRefetchNeeded).toHaveBeenCalled()
  })

  it('is called for join-link events', () => {
    const qc = new QueryClient()
    const onRefetchNeeded = call(qc, [makeLog.createJoinLink('c', rev(5))])
    expect(onRefetchNeeded).toHaveBeenCalled()
  })

  it('is called for logEditGroup', () => {
    const qc = new QueryClient()
    const onRefetchNeeded = call(qc, [makeLog.editGroup('c', rev(5))])
    expect(onRefetchNeeded).toHaveBeenCalled()
  })

  it('is called when a createMessage references an unknown convo', () => {
    const qc = new QueryClient()
    const onRefetchNeeded = call(qc, [
      makeLog.createMessage(
        'unknown',
        rev(5),
        makeMessageView({senderDid: OTHER, id: 'm', rev: rev(5)}),
      ),
    ])
    expect(onRefetchNeeded).toHaveBeenCalled()
  })

  it('is NOT called when a batch is fully handled surgically (mute on a known convo)', () => {
    const qc = new QueryClient()
    const key = RQKEY('accepted', 'all', 'all', undefined, 10)
    seedList(qc, key, [[makeConvo({id: 'c', rev: rev(1), muted: false})]])

    const onRefetchNeeded = call(qc, [makeLog.muteConvo('c', rev(5))])
    expect(onRefetchNeeded).not.toHaveBeenCalled()
  })
})
