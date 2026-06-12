/**
 * Shared, render-free fixtures for chat log-event tests. Builders return objects
 * tagged with the correct $type so the @atproto/api ChatBskyConvoDefs.isLogX /
 * isConvoView / isGroupConvo type guards (which only check the $type string)
 * pass. Kept generic - no jest, no QueryClient - so the event-bus test suite can
 * import it too.
 */
import {
  type $Typed,
  type ChatBskyActorDefs,
  type ChatBskyConvoDefs,
  type ChatBskyConvoGetLog,
} from '@atproto/api'

/**
 * Revs are fixed-width strings in real data and compared lexically by the
 * handler's rev guard. Zero-pad so numeric ordering matches string ordering.
 */
export function rev(n: number): string {
  return String(n).padStart(7, '0')
}

export function makeProfile(did: string): ChatBskyActorDefs.ProfileViewBasic {
  return {
    $type: 'chat.bsky.actor.defs#profileViewBasic',
    did,
    handle: `${did.replace(/[^a-z0-9]/gi, '')}.test`,
  } satisfies ChatBskyActorDefs.ProfileViewBasic
}

export function makeMessageView(
  overrides: Partial<ChatBskyConvoDefs.MessageView> & {
    senderDid: string
  },
): $Typed<ChatBskyConvoDefs.MessageView> {
  const {senderDid, ...rest} = overrides
  return {
    $type: 'chat.bsky.convo.defs#messageView',
    id: 'msg-1',
    rev: rev(1),
    text: 'hello',
    sender: {
      $type: 'chat.bsky.convo.defs#messageViewSender',
      did: senderDid,
    },
    sentAt: '2024-01-01T00:00:00.000Z',
    ...rest,
  }
}

export function makeSystemMessageView(
  data: ChatBskyConvoDefs.SystemMessageView['data'],
  overrides: Partial<Omit<ChatBskyConvoDefs.SystemMessageView, 'data'>> = {},
): ChatBskyConvoDefs.SystemMessageView {
  return {
    $type: 'chat.bsky.convo.defs#systemMessageView',
    id: 'sys-1',
    rev: rev(1),
    sentAt: '2024-01-01T00:00:00.000Z',
    data,
    ...overrides,
  }
}

type MakeConvoOverrides = Partial<Omit<ChatBskyConvoDefs.ConvoView, 'kind'>> & {
  /**
   * 'direct' builds a directConvo kind; 'group' builds a groupConvo kind with
   * sensible defaults. Pass a full kind object to override entirely.
   */
  kind?: 'direct' | 'group' | ChatBskyConvoDefs.ConvoView['kind']
  groupKind?: Partial<ChatBskyConvoDefs.GroupConvo>
}

export function makeConvo(
  overrides: MakeConvoOverrides = {},
): ChatBskyConvoDefs.ConvoView {
  const {kind = 'direct', groupKind, ...rest} = overrides

  let resolvedKind: ChatBskyConvoDefs.ConvoView['kind']
  if (kind === 'direct') {
    resolvedKind = {$type: 'chat.bsky.convo.defs#directConvo'}
  } else if (kind === 'group') {
    resolvedKind = {
      $type: 'chat.bsky.convo.defs#groupConvo',
      createdAt: '2024-01-01T00:00:00.000Z',
      lockStatus: 'unlocked',
      lockStatusModerationOverride: false,
      memberCount: 3,
      memberLimit: 50,
      name: 'Test Group',
      ...groupKind,
    } satisfies ChatBskyConvoDefs.GroupConvo
  } else {
    resolvedKind = kind
  }

  return {
    $type: 'chat.bsky.convo.defs#convoView',
    id: 'convo-1',
    rev: rev(1),
    members: [makeProfile('did:plc:me'), makeProfile('did:plc:other')],
    muted: false,
    status: 'accepted',
    unreadCount: 0,
    kind: resolvedKind,
    ...rest,
  }
}

type Log = ChatBskyConvoGetLog.OutputSchema['logs'][number]

/**
 * Builders for the log event types the handler tests exercise. Each returns an
 * object with the correct $type so the corresponding isLogX guard passes.
 */
export const makeLog = {
  beginConvo(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogBeginConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logBeginConvo',
      rev: r,
      convoId,
    }
  },
  acceptConvo(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogAcceptConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logAcceptConvo',
      rev: r,
      convoId,
    }
  },
  leaveConvo(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogLeaveConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logLeaveConvo',
      rev: r,
      convoId,
    }
  },
  muteConvo(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogMuteConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logMuteConvo',
      rev: r,
      convoId,
    }
  },
  unmuteConvo(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogUnmuteConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logUnmuteConvo',
      rev: r,
      convoId,
    }
  },
  readConvo(
    convoId: string,
    r: string,
    message: $Typed<ChatBskyConvoDefs.MessageView>,
  ): $Typed<ChatBskyConvoDefs.LogReadConvo> {
    return {
      $type: 'chat.bsky.convo.defs#logReadConvo',
      rev: r,
      convoId,
      message,
    }
  },
  createMessage(
    convoId: string,
    r: string,
    message: $Typed<ChatBskyConvoDefs.MessageView>,
    relatedProfiles?: ChatBskyActorDefs.ProfileViewBasic[],
  ): $Typed<ChatBskyConvoDefs.LogCreateMessage> {
    return {
      $type: 'chat.bsky.convo.defs#logCreateMessage',
      rev: r,
      convoId,
      message,
      ...(relatedProfiles ? {relatedProfiles} : {}),
    }
  },
  editGroup(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogEditGroup> {
    return {
      $type: 'chat.bsky.convo.defs#logEditGroup',
      rev: r,
      convoId,
      message: makeSystemMessageView({
        $type: 'chat.bsky.convo.defs#systemMessageDataEditGroup',
        newName: 'Renamed',
      }),
    }
  },
  createJoinLink(
    convoId: string,
    r: string,
  ): $Typed<ChatBskyConvoDefs.LogCreateJoinLink> {
    return {
      $type: 'chat.bsky.convo.defs#logCreateJoinLink',
      rev: r,
      convoId,
      message: makeSystemMessageView({
        $type: 'chat.bsky.convo.defs#systemMessageDataCreateJoinLink',
      }),
    }
  },
  addMember(
    convoId: string,
    r: string,
    memberDid: string,
    relatedProfiles: ChatBskyActorDefs.ProfileViewBasic[],
  ): $Typed<ChatBskyConvoDefs.LogAddMember> {
    return {
      $type: 'chat.bsky.convo.defs#logAddMember',
      rev: r,
      convoId,
      message: makeSystemMessageView({
        $type: 'chat.bsky.convo.defs#systemMessageDataAddMember',
        member: {
          $type: 'chat.bsky.convo.defs#systemMessageReferredUser',
          did: memberDid,
        },
        role: 'standard',
        addedBy: {
          $type: 'chat.bsky.convo.defs#systemMessageReferredUser',
          did: 'did:plc:me',
        },
      }),
      relatedProfiles,
    }
  },
} satisfies Record<string, (...args: never[]) => Log>
