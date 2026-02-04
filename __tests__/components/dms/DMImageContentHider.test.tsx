import React from 'react'
import {Text} from 'react-native'
import {type ChatBskyConvoDefs, ModerationUI} from '@atproto/api'
import {render} from '@testing-library/react-native'

import * as preferences from '#/state/preferences'
import {useSession} from '#/state/session'
import {DMImageContentHider} from '#/components/dms/DMImageContentHider'

// Mock dependencies
jest.mock('#/state/preferences', () => ({
  useDmImageAlwaysBlur: jest.fn(() => false),
  useDmImageBlurFromNonFollows: jest.fn(() => false),
}))

jest.mock('#/state/session', () => ({
  useSession: jest.fn(() => ({
    currentAccount: {did: 'did:plc:current-user'},
  })),
}))

jest.mock('#/components/moderation/ContentHider', () => {
  const {View: MockView} = require('react-native')
  return {
    ContentHider: ({
      children,
      testID,
      modui,
    }: {
      children: React.ReactNode
      testID?: string
      modui: {blurs?: Array<unknown>} | undefined
    }) => {
      // Match real ContentHider behavior: check if there are blurs
      const hasBlur = !!(modui?.blurs && modui.blurs.length > 0)
      return (
        <MockView testID={hasBlur ? testID : undefined}>
          {typeof children === 'function'
            ? children({active: hasBlur})
            : children}
        </MockView>
      )
    },
  }
})

describe('DMImageContentHider', () => {
  const mockCurrentUserDid = 'did:plc:current-user'
  const mockSenderDid = 'did:plc:sender'
  const mockFollowingUri = 'at://did:plc:sender/app.bsky.graph.follow/123'

  // Helper to create test data
  const createMessage = (
    senderDid: string = mockSenderDid,
  ): ChatBskyConvoDefs.MessageView =>
    ({
      id: 'msg-1',
      sender: {did: senderDid},
      sentAt: new Date().toISOString(),
    }) as ChatBskyConvoDefs.MessageView

  const createConvo = (
    members: Array<{
      did: string
      following?: string
    }>,
  ): ChatBskyConvoDefs.ConvoView =>
    ({
      id: 'convo-1',
      members: members.map(m => ({
        did: m.did,
        handle: `${m.did}.bsky.social`,
        viewer: m.following ? {following: m.following} : undefined,
      })),
    }) as ChatBskyConvoDefs.ConvoView

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({
      currentAccount: {did: mockCurrentUserDid},
    })
    ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(false)
    ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
      false,
    )
  })

  describe('Own Messages', () => {
    it('should never blur images from yourself', () => {
      const message = createMessage(mockCurrentUserDid)
      const convo = createConvo([{did: mockCurrentUserDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should render directly without ContentHider wrapper
      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })

    it('should not blur own images even when alwaysBlur is true', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(true)

      const message = createMessage(mockCurrentUserDid)
      const convo = createConvo([{did: mockCurrentUserDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })

    it('should not blur own images even when blurFromNonFollows is true', () => {
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage(mockCurrentUserDid)
      const convo = createConvo([{did: mockCurrentUserDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Backend Moderation Priority', () => {
    it('should use backend moderation when provided', () => {
      const backendModui = new ModerationUI()
      backendModui.blurs = [
        {
          type: 'label',
          source: {type: 'user'},
          label: {
            val: 'porn',
            uri: '',
            cid: '',
            src: 'did:plc:labeler',
            cts: new Date().toISOString(),
          },
          labelDef: {} as any,
          target: 'content',
          setting: 'warn',
          behavior: {},
          noOverride: false,
          priority: 2,
        },
      ]

      const message = createMessage()
      const convo = createConvo([
        {did: mockSenderDid, following: mockFollowingUri},
      ])

      const {getByTestId} = render(
        <DMImageContentHider
          message={message}
          convo={convo}
          moderation={backendModui}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should use ContentHider with backend moderation
      expect(getByTestId('dm-image-content-hider')).toBeTruthy()
    })

    it('should prioritize backend moderation over user preferences', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(true)

      const backendModui = new ModerationUI() // Empty moderation (no blurs)

      const message = createMessage()
      const convo = createConvo([{did: mockSenderDid}])

      const {queryByTestId} = render(
        <DMImageContentHider
          message={message}
          convo={convo}
          moderation={backendModui}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Backend says no blur, so shouldn't blur despite user preference
      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Always Blur Preference', () => {
    const testCases = [
      {
        description: 'following user',
        following: mockFollowingUri,
        shouldBlur: true,
      },
      {
        description: 'non-following user',
        following: undefined,
        shouldBlur: true,
      },
    ]

    testCases.forEach(({description, following, shouldBlur}) => {
      it(`should blur images from ${description} when alwaysBlur is enabled`, () => {
        ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(true)

        const message = createMessage()
        const convo = createConvo([{did: mockSenderDid, following}])

        const {queryByTestId} = render(
          <DMImageContentHider message={message} convo={convo}>
            <Text>Image Content</Text>
          </DMImageContentHider>,
        )

        if (shouldBlur) {
          expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
        } else {
          expect(queryByTestId('dm-image-content-hider')).toBeNull()
        }
      })
    })

    it('should not blur when alwaysBlur is disabled', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(false)

      const message = createMessage()
      const convo = createConvo([{did: mockSenderDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Blur From Non-Follows Preference', () => {
    const testCases = [
      {
        description: 'user you follow',
        following: mockFollowingUri,
        shouldBlur: false,
      },
      {
        description: 'user you do not follow',
        following: undefined,
        shouldBlur: true,
      },
    ]

    testCases.forEach(({description, following, shouldBlur}) => {
      it(`should ${shouldBlur ? 'blur' : 'not blur'} images from ${description}`, () => {
        ;(
          preferences.useDmImageBlurFromNonFollows as jest.Mock
        ).mockReturnValue(true)

        const message = createMessage()
        const convo = createConvo([{did: mockSenderDid, following}])

        const {queryByTestId} = render(
          <DMImageContentHider message={message} convo={convo}>
            <Text>Image Content</Text>
          </DMImageContentHider>,
        )

        if (shouldBlur) {
          expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
        } else {
          expect(queryByTestId('dm-image-content-hider')).toBeNull()
        }
      })
    })

    it('should not blur when blurFromNonFollows is disabled', () => {
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        false,
      )

      const message = createMessage()
      const convo = createConvo([{did: mockSenderDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should render directly when message has no sender', () => {
      const message = {
        id: 'msg-1',
        sender: undefined,
        sentAt: new Date().toISOString(),
      } as any

      const convo = createConvo([])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })

    it('should blur when sender is not found in convo members', () => {
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage('did:plc:unknown-sender')
      const convo = createConvo([{did: mockSenderDid}]) // Different DID

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should blur as a safer default
      expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
    })

    it('should blur when sender has no viewer data', () => {
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage()
      const convo = {
        id: 'convo-1',
        members: [
          {
            did: mockSenderDid,
            handle: 'sender.bsky.social',
            viewer: undefined, // No viewer data
          },
        ],
      } as any

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should blur when viewer data is missing
      expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
    })

    it('should handle empty convo members array', () => {
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage()
      const convo = {
        id: 'convo-1',
        members: [],
      } as any

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should blur as safer default
      expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
    })

    it('should handle null/undefined current user DID', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        currentAccount: undefined,
      })

      const message = createMessage()
      const convo = createConvo([{did: mockSenderDid}])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should not crash and render without blur
      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Preference Priority', () => {
    it('should prioritize alwaysBlur over blurFromNonFollows', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(true)
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage()
      const convo = createConvo([
        {did: mockSenderDid, following: mockFollowingUri},
      ])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should blur because alwaysBlur is true (even though we follow the sender)
      expect(queryByTestId('dm-image-content-hider')).toBeTruthy()
    })

    it('should not blur following users when only blurFromNonFollows is enabled', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(false)
      ;(preferences.useDmImageBlurFromNonFollows as jest.Mock).mockReturnValue(
        true,
      )

      const message = createMessage()
      const convo = createConvo([
        {did: mockSenderDid, following: mockFollowingUri},
      ])

      const {queryByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      // Should not blur because we follow the sender
      expect(queryByTestId('dm-image-content-hider')).toBeNull()
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('should render children correctly', () => {
      const message = createMessage(mockCurrentUserDid)
      const convo = createConvo([{did: mockCurrentUserDid}])

      const {getByText} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Test Image Content</Text>
        </DMImageContentHider>,
      )

      expect(getByText('Test Image Content')).toBeTruthy()
    })

    it('should pass correct testID to ContentHider', () => {
      ;(preferences.useDmImageAlwaysBlur as jest.Mock).mockReturnValue(true)

      const message = createMessage()
      const convo = createConvo([{did: mockSenderDid}])

      const {getByTestId} = render(
        <DMImageContentHider message={message} convo={convo}>
          <Text>Image Content</Text>
        </DMImageContentHider>,
      )

      expect(getByTestId('dm-image-content-hider')).toBeTruthy()
    })
  })
})
