import {act, fireEvent, render} from '@testing-library/react-native'

import * as Menu from '#/components/Menu'
import {PostMenuButton} from '#/components/PostControls/PostMenu'
import {ShareMenuButton} from '#/components/PostControls/ShareMenu'

jest.mock('#/components/Menu', () => {
  const {View} = require('react-native')
  const open = jest.fn()
  let currentControl:
    {open: (options: {sourceViewTag: number}) => void} | undefined

  return {
    __testOpen: open,
    Root: ({
      children,
      control,
    }: {
      children: React.ReactNode
      control: unknown
    }) => {
      currentControl = control as typeof currentControl
      return <View>{children}</View>
    },
    Trigger: ({
      children,
    }: {
      children: (args: {
        props: {accessibilityLabel: string; onPress: () => void}
      }) => React.ReactNode
    }) => {
      if (!currentControl) throw new Error('Menu root has not rendered')
      return children({
        props: {
          accessibilityLabel: 'Open menu',
          onPress: () => currentControl?.open({sourceViewTag: 42}),
        },
      })
    },
    useMenuControl: () => ({open}),
  }
})

jest.mock('#/components/PostControls/PostControlButton', () => {
  const {Pressable} = require('react-native')

  return {
    PostControlButton: ({
      children,
      label,
      onPress,
      testID,
    }: React.PropsWithChildren<{
      label?: string
      onPress?: () => void
      testID?: string
    }>) => (
      <Pressable
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    PostControlButtonIcon: () => null,
  }
})

jest.mock('#/components/PostControls/PostMenu/PostMenuItems', () => {
  const {View} = require('react-native')
  return {PostMenuItems: () => <View testID="lazy-post-menu-items" />}
})
jest.mock('#/components/PostControls/ShareMenu/ShareMenuItems', () => {
  const {View} = require('react-native')
  return {ShareMenuItems: () => <View testID="lazy-share-menu-items" />}
})
jest.mock('#/view/com/util/EventStopper', () => ({
  EventStopper: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/ArrowShareRight', () => ({
  ArrowShareRight_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/PostControls/util', () => ({
  useFormatPostStatCount: () => String,
}))
/** Records analytics calls in order, so tests can check what ran first. */
const mockAnalyticsCalls: string[] = []
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: (event: string) => mockAnalyticsCalls.push(event),
    features: {
      enabled: (feature: string) => {
        mockAnalyticsCalls.push(`enabled:${feature}`)
        return false
      },
      ShareDestinationsEnable: 'share_destinations:enable',
    },
  }),
}))
jest.mock('#/state/feed-feedback', () => ({
  useFeedFeedbackContext: () => ({feedDescriptor: undefined}),
}))
jest.mock('#/lib/routes/links', () => ({makeProfileLink: jest.fn()}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('#/lib/strings/url-helpers', () => ({toShareUrl: jest.fn()}))
jest.mock('#/alf', () => ({
  native: (callback: () => void) => callback,
  useBreakpoints: () => ({gtMobile: false}),
}))
jest.mock('@lingui/react/macro', () => ({
  useLingui: () => ({t: (message: TemplateStringsArray) => message[0]}),
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: () => 'Open share menu'}),
}))

const mockMenuOpen = (Menu as unknown as {__testOpen: jest.Mock}).__testOpen

const post = {
  uri: 'at://did:plc:test/app.bsky.feed.post/test',
  author: {did: 'did:plc:test'},
}

afterEach(() => {
  mockAnalyticsCalls.length = 0
  jest.clearAllMocks()
  jest.useRealTimers()
})

describe('lazy post menu anchoring', () => {
  it('forwards the trigger source tag after mounting post menu items', () => {
    jest.useFakeTimers()
    const screen = render(
      <PostMenuButton
        testID="post"
        post={post as never}
        postFeedContext={undefined}
        postReqId={undefined}
        record={{} as never}
        richText={{} as never}
        timestamp="2026-09-27T00:00:00.000Z"
        logContext="Post"
        forceGoogleTranslate={false}
      />,
    )

    fireEvent.press(screen.getByTestId('postDropdownBtn'))

    expect(screen.getByTestId('lazy-post-menu-items')).toBeTruthy()
    expect(mockMenuOpen).not.toHaveBeenCalled()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockMenuOpen).toHaveBeenCalledWith({sourceViewTag: 42})
  })

  it('forwards the trigger source tag after mounting share menu items', () => {
    jest.useFakeTimers()
    const screen = render(
      <ShareMenuButton
        testID="post"
        post={post as never}
        record={{} as never}
        richText={{} as never}
        timestamp="2026-09-27T00:00:00.000Z"
        onShare={jest.fn()}
        logContext="Post"
      />,
    )

    fireEvent.press(screen.getByTestId('postShareBtn'))

    expect(screen.getByTestId('lazy-share-menu-items')).toBeTruthy()
    expect(mockMenuOpen).not.toHaveBeenCalled()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockMenuOpen).toHaveBeenCalledWith({sourceViewTag: 42})
  })

  it('checks the share sheet flag before logging the share press', () => {
    const screen = render(
      <ShareMenuButton
        testID="post"
        post={post as never}
        record={{} as never}
        richText={{} as never}
        timestamp="2026-09-27T00:00:00.000Z"
        onShare={jest.fn()}
        logContext="Post"
      />,
    )

    fireEvent.press(screen.getByTestId('postShareBtn'))

    /*
     * Checking the flag logs the experiment exposure, so it has to come
     * first for the open to count as exposed.
     */
    expect(mockAnalyticsCalls).toEqual([
      'enabled:share_destinations:enable',
      'post:share',
    ])
  })
})
