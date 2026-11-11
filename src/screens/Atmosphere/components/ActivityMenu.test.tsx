import type * as ReactNative from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {
  act,
  fireEvent,
  fireEventAsync,
  render,
  waitFor,
} from '@testing-library/react-native'

import {
  type ActivityAssociatedPost,
  getActivityAssociatedPost,
} from '#/screens/Atmosphere/activityPost'
import {
  createActivity,
  createActor,
  createActorGroup,
  createPostView,
  createRow,
  createSubjectGroup,
} from '#/screens/Atmosphere/testFixtures'
import {
  type ActivityActor,
  type ActivityGroup,
  type ActivityItem,
} from '#/screens/Atmosphere/types'
import {type DialogControlProps} from '#/components/Dialog'
import {type app} from '#/lexicons'
import {ActivityMenu} from './ActivityMenu'

const mockMute = jest.fn()
const mockUnmute = jest.fn()
const mockBlock = jest.fn()
const mockUnblock = jest.fn()
const mockGetPost = jest.fn()
const mockReport = jest.fn()
const mockToast = jest.fn()
const mockSignIn = jest.fn()
const mockNavigate = jest.fn()
const mockSession: {currentAccount?: {did: string}} = {
  currentAccount: {did: 'did:plc:viewer'},
}
type Children = {children?: React.ReactNode}

jest.unmock('multiformats/cid')
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))

jest.mock('#/alf', () => ({atoms: {}}))

jest.mock('#/state/cache/profile-shadow', () => ({
  useProfileShadow: (actor: ActivityActor) => actor,
}))
jest.mock('#/state/queries/profile', () => ({
  useProfileMuteMutationQueue: () => [mockMute, mockUnmute],
  useProfileBlockMutationQueue: () => [mockBlock, mockUnblock],
}))
jest.mock('#/state/queries/post', () => ({
  useGetPost: () => mockGetPost,
}))
jest.mock('#/state/session', () => ({
  useSession: () => mockSession,
  useRequireAuth: () => (fn: () => unknown) => {
    if (mockSession.currentAccount) fn()
    else mockSignIn()
  },
}))
jest.mock('#/components/Dialog', () => {
  const {useState} = jest.requireActual<typeof import('react')>('react')
  const {View} = jest.requireActual<typeof ReactNative>('react-native')
  return {
    useDialogControl: () => {
      const [isOpen, setIsOpen] = useState(false)
      return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }
    },
    Outer: ({children, control}: Children & {control: DialogControlProps}) =>
      control.isOpen ? <View>{children}</View> : null,
    ScrollableInner: ({children, label}: Children & {label: string}) => (
      <View accessibilityHint="" accessibilityLabel={label}>
        {children}
      </View>
    ),
    Handle: () => null,
    Close: () => null,
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} = jest.requireActual<typeof ReactNative>('react-native')
  return {Text}
})
jest.mock('#/components/moderation/ReportDialog', () => ({
  useGlobalReportDialogControl: () => ({open: mockReport}),
}))
jest.mock('#/components/moderation/BlockDialog', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof ReactNative>('react-native')
  return {
    BlockDialog: ({
      control,
      onBlock,
    }: {
      control: DialogControlProps
      onBlock: () => Promise<void>
    }) =>
      control.isOpen ? (
        <Pressable
          accessibilityHint=""
          accessibilityLabel="Confirm block action"
          onPress={onBlock}>
          <Text>Confirm block action</Text>
        </Pressable>
      ) : null,
  }
})
jest.mock('#/components/Toast', () => ({
  show: (...args: unknown[]) => mockToast(...args),
}))
jest.mock('#/view/com/util/EventStopper', () => ({
  EventStopper: ({children}: Children) => children,
}))
jest.mock('#/components/PostControls/PostControlButton', () => {
  const {Pressable} = jest.requireActual<typeof ReactNative>('react-native')
  return {
    PostControlButton: ({
      children,
      label,
      ...props
    }: Children & {label: string}) => (
      <Pressable {...props} accessibilityHint="" accessibilityLabel={label}>
        {children}
      </Pressable>
    ),
    PostControlButtonIcon: () => null,
  }
})
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Menu', () => {
  const {View, Pressable, Text} =
    jest.requireActual<typeof ReactNative>('react-native')
  return {
    Root: ({children}: Children) => <View>{children}</View>,
    Outer: ({children}: Children) => <View>{children}</View>,
    Group: ({children}: Children) => <View>{children}</View>,
    Trigger: ({
      children,
      label,
    }: {
      children: (args: {props: {accessibilityLabel: string}}) => React.ReactNode
      label: string
    }) => children({props: {accessibilityLabel: label}}),
    Item: ({
      children,
      label,
      onPress,
      disabled,
    }: Children & {label: string; onPress: () => void; disabled?: boolean}) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="menuitem"
        disabled={disabled}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ItemText: ({children}: Children) => <Text>{children}</Text>,
    ItemIcon: () => null,
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})
beforeEach(() => {
  jest.clearAllMocks()
  mockSession.currentAccount = {did: 'did:plc:viewer'}
  mockGetPost.mockReset()
  mockMute.mockReset().mockResolvedValue(undefined)
  mockUnmute.mockReset().mockResolvedValue(undefined)
  mockBlock.mockReset().mockResolvedValue(undefined)
  mockUnblock.mockReset().mockResolvedValue(undefined)
})

function associatedPost(
  view = createPostView(),
  includeView = true,
): ActivityAssociatedPost {
  return {
    uri: view.uri,
    cid: view.cid,
    ...(includeView ? {view} : {}),
  }
}

function renderMenu(
  actor = createActor(),
  post?: ActivityAssociatedPost,
  rawResponse: ActivityItem | ActivityGroup = createActivity(),
) {
  return render(
    <I18nProvider i18n={i18n}>
      <ActivityMenu actor={actor} post={post} rawResponse={rawResponse} />
    </I18nProvider>,
  )
}

describe('Atmosphere activity moderation menu', () => {
  it('navigates to bskyPostRef rather than the actor or hydrated post without requiring sign-in', () => {
    mockSession.currentAccount = undefined
    const activity = createActivity({view: createPostView()})
    activity.bskyPostRef = {
      uri: 'at://did:plc:declared/app.bsky.feed.post/comments',
      cid: activity.record.cid,
    }
    const post = getActivityAssociatedPost(createRow([activity], {actors: {}}))
    const screen = renderMenu(createActor(), post)
    fireEvent.press(screen.getByRole('menuitem', {name: 'View Bluesky post'}))
    expect(mockNavigate).toHaveBeenCalledWith('PostThread', {
      name: 'did:plc:declared',
      rkey: 'comments',
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('omits post navigation when no usable post is associated', () => {
    const screen = renderMenu()
    expect(
      screen.queryByRole('menuitem', {name: 'View Bluesky post'}),
    ).toBeNull()
  })

  it('mutes an unmuted account', async () => {
    const screen = renderMenu(createActor(), associatedPost())
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Mute account'}),
    )
    expect(mockMute).toHaveBeenCalledTimes(1)
    expect(mockUnmute).not.toHaveBeenCalled()
  })

  it('unmutes an already muted actor', async () => {
    const screen = renderMenu({...createActor(), viewer: {muted: true}})
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Unmute account'}),
    )
    expect(mockUnmute).toHaveBeenCalledTimes(1)
    expect(mockMute).not.toHaveBeenCalled()
  })

  it.each([false, true])(
    'confirms before changing the actor block (already blocked: %s)',
    async blocking => {
      const actor: ActivityActor = {
        ...createActor(),
        viewer: blocking
          ? {blocking: 'at://did:plc:viewer/app.bsky.graph.block/block'}
          : undefined,
      }
      const screen = renderMenu(actor, associatedPost())
      fireEvent.press(
        screen.getByRole('menuitem', {
          name: blocking ? 'Unblock account' : 'Block account',
        }),
      )
      expect(mockBlock).not.toHaveBeenCalled()
      expect(mockUnblock).not.toHaveBeenCalled()
      await fireEventAsync.press(screen.getByLabelText('Confirm block action'))
      expect(blocking ? mockUnblock : mockBlock).toHaveBeenCalledTimes(1)
    },
  )

  it('does not offer direct mute/unmute for list mutes or blocked actors', () => {
    const actor = createActor()
    const screen = renderMenu({
      ...actor,
      viewer: {
        muted: true,
        mutedByList: {
          uri: 'at://did:plc:viewer/app.bsky.graph.list/list',
          cid: createPostView().cid,
          name: 'Muted list',
          purpose: 'app.bsky.graph.defs#modlist',
        },
      },
    })
    expect(screen.queryByRole('menuitem', {name: 'Unmute account'})).toBeNull()
    expect(screen.getByRole('menuitem', {name: 'Block account'})).toBeTruthy()
  })

  it('does not offer unblock for a list block or mute for an existing block', () => {
    const screen = renderMenu({
      ...createActor(),
      viewer: {
        blocking: 'at://did:plc:viewer/app.bsky.graph.block/block',
        blockingByList: {
          uri: 'at://did:plc:viewer/app.bsky.graph.list/list',
          cid: createPostView().cid,
          name: 'Blocked list',
          purpose: 'app.bsky.graph.defs#modlist',
        },
      },
    })
    expect(screen.queryByRole('menuitem', {name: 'Unblock account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Mute account'})).toBeNull()
    expect(screen.getByRole('menuitem', {name: 'Report account'})).toBeTruthy()
  })

  it('omits account actions for self but can report another associated author', async () => {
    const actor = createActor('did:plc:viewer')
    const screen = renderMenu(actor)
    expect(screen.queryByRole('menuitem', {name: 'Mute account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Block account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Report account'})).toBeNull()
    screen.rerender(
      <I18nProvider i18n={i18n}>
        <ActivityMenu
          actor={actor}
          post={associatedPost()}
          rawResponse={createActivity()}
        />
      </I18nProvider>,
    )
    expect(screen.queryByRole('menuitem', {name: 'Mute account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Block account'})).toBeNull()
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockReport).toHaveBeenCalledTimes(1)
  })

  it('opens raw inspection for self without exposing moderation actions', () => {
    const screen = renderMenu(createActor('did:plc:viewer'))
    expect(screen.queryByRole('menuitem', {name: 'Mute account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Block account'})).toBeNull()
    expect(screen.queryByRole('menuitem', {name: 'Report account'})).toBeNull()
    expect(screen.queryByLabelText('Raw response')).toBeNull()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View raw response'}))
    expect(screen.getByLabelText('Raw response')).toBeTruthy()
    expect(
      screen.getByTestId('atmosphereRawResponse').props.children,
    ).toContain(createActivity().record.uri)
  })

  it.each([createActorGroup, createSubjectGroup])(
    'inspects the original API group without rebuilding its references',
    makeGroup => {
      const group = makeGroup([
        createActivity({rkey: 'first'}),
        createActivity({rkey: 'second'}),
      ])
      const screen = renderMenu(createActor(), undefined, group)
      fireEvent.press(screen.getByRole('menuitem', {name: 'View raw response'}))
      expect(screen.getByTestId('atmosphereRawResponse').props.children).toBe(
        JSON.stringify(group, null, 2),
      )
    },
  )

  it('does not offer reporting a post owned by the current account', () => {
    const post = createPostView({
      uri: 'at://did:plc:viewer/app.bsky.feed.post/self',
      author: createActor('did:plc:viewer'),
    })
    const screen = renderMenu(createActor(), associatedPost(post))
    expect(screen.queryByRole('menuitem', {name: 'Report post'})).toBeNull()
  })

  it('reports the matching real post with its actual record and embed', async () => {
    const view = createPostView()
    const screen = renderMenu(createActor(), associatedPost(view))
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockGetPost).not.toHaveBeenCalled()
    expect(mockReport).toHaveBeenCalledWith({subject: view})
  })

  it('lazily loads a referenced post and shows a visible loading state', async () => {
    const view = createPostView()
    const {promise, resolve: resolvePost} =
      Promise.withResolvers<app.bsky.feed.defs.PostView>()
    mockGetPost.mockReturnValueOnce(promise)
    const screen = renderMenu(createActor(), associatedPost(view, false))
    expect(mockGetPost).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report post'}))
    expect(mockGetPost).toHaveBeenCalledWith({uri: view.uri})
    expect(screen.getByLabelText('Loading post…')).toBeDisabled()
    expect(mockReport).not.toHaveBeenCalled()
    await act(async () => {
      resolvePost(view)
      await promise
    })
    expect(mockReport).toHaveBeenCalledWith({subject: view})
    expect(screen.getByLabelText('More options')).toBeEnabled()
  })

  it('fetches instead of reporting a mismatched supplied view', async () => {
    const view = createPostView()
    const post = associatedPost(view)
    post.view = createPostView({
      uri: 'at://did:plc:wrong/app.bsky.feed.post/other',
    })
    mockGetPost.mockResolvedValueOnce(view)
    const screen = renderMenu(createActor(), post)
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockGetPost).toHaveBeenCalledWith({uri: post.uri})
    expect(mockReport).toHaveBeenCalledWith({subject: view})
  })

  it('does not report a fetched post with a mismatched URI', async () => {
    const view = createPostView()
    mockGetPost.mockResolvedValueOnce({...view, uri: `${view.uri}-other`})
    const screen = renderMenu(createActor(), associatedPost(view, false))
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockReport).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      'Could not load this post. Please try again.',
      {type: 'error'},
    )
  })

  it.each([false, true])(
    'rejects a changed pinned post revision (hydrated=%s)',
    async hydrated => {
      const original = createPostView()
      const updated = createPostView({
        cid: 'bafyreiaxduxpwdpjgvve3klfs4flkwjwfqiurszw4o6jvjarpqqmeqwiza',
      })
      const post = associatedPost(original, hydrated)
      if (hydrated) post.view = updated
      mockGetPost.mockResolvedValueOnce(updated)
      const screen = renderMenu(createActor(), post)
      await fireEventAsync.press(
        screen.getByRole('menuitem', {name: 'Report post'}),
      )
      expect(mockGetPost).toHaveBeenCalledWith({uri: original.uri})
      expect(mockReport).not.toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith(expect.any(String), {
        type: 'error',
      })
    },
  )

  it('reports newer explicit associated hydration with its actual CID', async () => {
    const view = createPostView({
      cid: 'bafyreiaxduxpwdpjgvve3klfs4flkwjwfqiurszw4o6jvjarpqqmeqwiza',
    })
    const activity = createActivity({viewBskyPost: view})
    activity.bskyPostRef = {uri: view.uri, cid: activity.record.cid}
    const post = getActivityAssociatedPost(createRow([activity], {actors: {}}))
    const screen = renderMenu(createActor(), post)
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockGetPost).not.toHaveBeenCalled()
    expect(mockReport).toHaveBeenCalledWith({subject: view})
  })

  it('shows private-safe lookup errors without falling back to an account report', async () => {
    mockGetPost.mockRejectedValueOnce(new Error('private post URI and payload'))
    const screen = renderMenu(createActor(), associatedPost(undefined, false))
    await fireEventAsync.press(
      screen.getByRole('menuitem', {name: 'Report post'}),
    )
    expect(mockReport).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      'Could not load this post. Please try again.',
      {type: 'error'},
    )
    expect(screen.getByLabelText('More options')).toBeEnabled()
  })

  it('reports the real primary account only when no associated post exists', () => {
    const actor = createActor()
    const screen = renderMenu(actor)
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report account'}))
    expect(mockReport).toHaveBeenCalledWith({
      subject: {...actor, $type: 'app.bsky.actor.defs#profileViewBasic'},
    })
    expect(mockGetPost).not.toHaveBeenCalled()
  })

  it('uses the existing sign-in flow for logged-out moderation actions', () => {
    mockSession.currentAccount = undefined
    const screen = renderMenu(createActor(), associatedPost(undefined, false))
    fireEvent.press(screen.getByRole('menuitem', {name: 'Mute account'}))
    fireEvent.press(screen.getByRole('menuitem', {name: 'Block account'}))
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report post'}))
    expect(mockSignIn).toHaveBeenCalledTimes(3)
    expect(mockMute).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Confirm block action')).toBeNull()
    expect(mockGetPost).not.toHaveBeenCalled()
    expect(mockReport).not.toHaveBeenCalled()
  })

  it.each(['mute', 'block'] as const)(
    'does not reveal raw %s failure details',
    async action => {
      const mutation = action === 'mute' ? mockMute : mockBlock
      mutation.mockRejectedValueOnce(new Error('private server response'))
      const screen = renderMenu()
      if (action === 'block') {
        fireEvent.press(screen.getByRole('menuitem', {name: 'Block account'}))
      }
      await fireEventAsync.press(
        action === 'mute'
          ? screen.getByRole('menuitem', {name: 'Mute account'})
          : screen.getByLabelText('Confirm block action'),
      )
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          'Something went wrong. Please try again.',
          {type: 'error'},
        )
      })
    },
  )
})

it('shows a load error instead of opening an unsupported post report subject', async () => {
  const view = createPostView({record: {$type: 'unknown.collection'}})
  const screen = renderMenu(createActor(), associatedPost(view))
  await fireEventAsync.press(
    screen.getByRole('menuitem', {name: 'Report post'}),
  )
  expect(mockReport).not.toHaveBeenCalled()
  expect(mockToast).toHaveBeenCalledWith(expect.any(String), {type: 'error'})
  expect(screen.getByLabelText('More options')).toBeEnabled()
})
