import {type Client} from '@atproto/lex'
import {describe, expect, jest, test} from '@jest/globals'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
  EmbeddingDisabledError: class extends Error {},
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/lib/haptics', () => ({useHaptics: () => ({toggle: jest.fn()})}))
/* Neither inspection view opens a dialog; avoid loading the native sheet. */
jest.mock('#/components/Dialog', () => ({}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('expo-image', () => {
  const {Image} = require('react-native') as typeof import('react-native')
  return {Image}
})
jest.mock('@bsky.app/react-native-uitextview', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {UITextView: Text}
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {MediaAttachmentView} from '#/view/screens/DebugComposer/components/AttachmentControls'
import {PlanSection} from '#/view/screens/DebugComposer/components/PlanSection'
import {usePlanRunner} from '#/view/screens/DebugComposer/usePlanRunner'
import {ThreadStoreProvider} from '#/components/ComposerV2/hooks'
import {planComposerV2} from '#/components/ComposerV2/planner'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type MediaAttachment} from '#/components/ComposerV2/store/types'

const i18n = setupI18n({locale: 'en', messages: {en: {}}})
const resolvers = {} as LinkResolvers
const appviewCall = jest.fn(() => {
  throw new Error('Unexpected network call')
})
const appviewClient = {call: appviewCall} as unknown as Client

describe('tester record inspection', () => {
  test('shows every generated write, including post contents and gate records', async () => {
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      initialState: {
        posts: [{text: 'Full record contents', tags: ['tester']}],
        threadgateAllowRules: [],
        postgateEmbeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
      },
    })
    const planner = jest.fn<typeof planComposerV2>(planComposerV2)
    const onPublishPlan = jest.fn()
    const session = {key: 'inspection', scenarioId: 'empty' as const, store}
    function Harness({publishLocked = false}: {publishLocked?: boolean}) {
      const plan = usePlanRunner({
        session,
        dependencies: {did: 'did:plc:tester', appviewClient},
        requireAltText: false,
        __plan: planner,
      })
      return (
        <PlanSection
          plan={plan}
          requireAltText={false}
          onChangeRequireAltText={() => {}}
          accountDid="did:plc:tester"
          publishLocked={publishLocked}
          onPublishPlan={onPublishPlan}
        />
      )
    }
    const {unmount, rerender} = render(
      <I18nProvider i18n={i18n}>
        <Harness />
      </I18nProvider>,
    )
    try {
      await act(async () => {
        fireEvent.press(screen.getByTestId('composerV2Tester-plan'))
        await planner.mock.results[0].value
      })
      expect(screen.queryByTestId('composerV2Tester-plan-records')).toBeNull()
      fireEvent.press(
        screen.getByTestId('composerV2Tester-plan-records-toggle'),
      )
      const output = screen.getByTestId('composerV2Tester-plan-records')
      const call = planner.mock.results[0]
      if (call.type !== 'return')
        throw new Error('Expected the planner to return')
      const planned = await call.value
      expect(planned.ok).toBe(true)
      if (!planned.ok) throw new Error('Expected a successful plan')
      expect(output.props.children).toEqual([
        JSON.stringify(planned.writes, null, 2),
      ])
      expect(planned.writes.map(write => write.collection)).toEqual([
        'app.bsky.feed.post',
        'app.bsky.feed.threadgate',
        'app.bsky.feed.postgate',
      ])
      expect(output.props.numberOfLines).toBeUndefined()
      expect(output.props.selectable).toBe(true)
      expect(appviewCall).not.toHaveBeenCalled()
      expect(onPublishPlan).not.toHaveBeenCalled()
      expect(screen.getByTestId('composerV2Tester-publish')).toBeDisabled()

      fireEvent.press(screen.getByTestId('composerV2Tester-publish-enable'))
      const publishButton = screen.getByTestId('composerV2Tester-publish')
      expect(publishButton).toBeEnabled()
      act(() => {
        store.actions.setPostText(
          Object.keys(store.getState().posts)[0],
          'Changed after planning',
        )
      })
      expect(screen.getByTestId('composerV2Tester-plan-stale')).toBeTruthy()
      expect(screen.getByTestId('composerV2Tester-publish')).toBeDisabled()
      fireEvent.press(screen.getByTestId('composerV2Tester-publish'))
      expect(onPublishPlan).not.toHaveBeenCalled()
      await act(async () => {
        fireEvent.press(screen.getByTestId('composerV2Tester-plan'))
        await planner.mock.results[1].value
      })
      const refreshedPlan = await planner.mock.results[1].value
      expect(screen.getByTestId('composerV2Tester-publish')).toBeEnabled()
      fireEvent.press(screen.getByTestId('composerV2Tester-publish'))
      expect(onPublishPlan).toHaveBeenCalledTimes(1)
      expect(onPublishPlan).toHaveBeenCalledWith(refreshedPlan)

      rerender(
        <I18nProvider i18n={i18n}>
          <Harness publishLocked />
        </I18nProvider>,
      )
      expect(screen.getByTestId('composerV2Tester-plan')).toBeDisabled()
      expect(screen.getByTestId('composerV2Tester-plan-clear')).toBeDisabled()
      expect(screen.getByTestId('composerV2Tester-publish')).toBeDisabled()
      expect(
        screen.getByTestId('composerV2Tester-publish-enable'),
      ).toBeDisabled()
      rerender(
        <I18nProvider i18n={i18n}>
          <Harness />
        </I18nProvider>,
      )
      fireEvent.press(screen.getByTestId('composerV2Tester-plan-clear'))
      expect(screen.queryByTestId('composerV2Tester-plan-records')).toBeNull()
    } finally {
      unmount()
      store.destroy()
    }
  })

  test('only offers empty-post confirmation for the unchanged snapshot', async () => {
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      initialState: {posts: [{text: 'first'}, {text: ''}, {text: 'third'}]},
    })
    const planner = jest.fn<typeof planComposerV2>(planComposerV2)
    const session = {key: 'empty-post', scenarioId: 'thread' as const, store}
    function Harness() {
      const plan = usePlanRunner({
        session,
        dependencies: {did: 'did:plc:tester', appviewClient},
        requireAltText: false,
        __plan: planner,
      })
      return (
        <PlanSection
          plan={plan}
          requireAltText={false}
          onChangeRequireAltText={() => {}}
          accountDid="did:plc:tester"
          publishLocked={false}
          onPublishPlan={() => {}}
        />
      )
    }
    const {unmount} = render(
      <I18nProvider i18n={i18n}>
        <Harness />
      </I18nProvider>,
    )
    try {
      await act(async () => {
        fireEvent.press(screen.getByTestId('composerV2Tester-plan'))
        await planner.mock.results[0].value
      })
      expect(
        screen.getByTestId('composerV2Tester-plan-confirm-skip'),
      ).toBeTruthy()
      act(() => {
        store.actions.setPostText(
          Object.keys(store.getState().posts)[1],
          'now filled',
        )
      })
      expect(screen.getByTestId('composerV2Tester-plan-stale')).toBeTruthy()
      expect(
        screen.queryByTestId('composerV2Tester-plan-confirm-skip'),
      ).toBeNull()
    } finally {
      unmount()
      store.destroy()
    }
  })

  test('URI failure UI uses localized guidance, not raw diagnostics', async () => {
    const cause = new Error('private resolver path and content')
    const onError = jest.fn()
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      onError,
      __createId: () => 'post-1',
      __resolveLink: () => Promise.reject(cause),
    })
    const {unmount} = render(
      <I18nProvider i18n={i18n}>
        <ThreadStoreProvider store={store}>
          <MediaAttachmentView postId="post-1" />
        </ThreadStoreProvider>
      </I18nProvider>,
    )
    try {
      await act(async () => {
        store.actions.addUri('post-1', 'https://example.com')
        await Promise.resolve()
      })
      expect(
        screen.getByText('The link could not be resolved. Please try again.'),
      ).toBeTruthy()
      expect(screen.queryByText(cause.message)).toBeNull()
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][1]).toBe(cause)
    } finally {
      unmount()
      store.destroy()
    }
  })

  test('shows the entire external attachment, including thumbnail metadata and supplied view', () => {
    const media: MediaAttachment = {
      state: 'resolved',
      kind: 'external',
      uri: 'https://example.com/article',
      title: 'Full external title',
      description: 'First line\nSecond line\nThird line, without truncation',
      thumb: {
        alt: 'Thumbnail alt text',
        source: {
          id: 'thumbnail',
          path: 'file:///test-thumbnail.jpg',
          width: 640,
          height: 480,
          mime: 'image/jpeg',
        },
      },
      associatedRefs: [
        {
          uri: 'at://did:plc:tester/site.standard.document/example',
          cid: 'bafkreieq5jui4j25lacwomsqgjeswwl3y5zcdrresptwgmfylxo2depppq',
        },
      ],
      view: {
        $type: 'app.bsky.embed.external#view',
        external: {
          uri: 'https://example.com/article',
          title: 'Supplied view title',
          description: 'Supplied view description',
          thumb: 'https://example.com/thumbnail.jpg',
        },
      },
    }
    const store = createThreadStore({
      defaultLanguages: [],
      ...testUploadRuntime,
      resolvers,
      __createId: () => 'post-1',
      initialState: {posts: [{attachments: {media}}]},
    })
    const {unmount} = render(
      <I18nProvider i18n={i18n}>
        <ThreadStoreProvider store={store}>
          <MediaAttachmentView postId="post-1" />
        </ThreadStoreProvider>
      </I18nProvider>,
    )
    try {
      const output = screen.getByTestId(
        'composerV2Tester-post-post-1-external-fields',
      )
      expect(output.props.children).toEqual([JSON.stringify(media, null, 2)])
      expect(output.props.numberOfLines).toBeUndefined()
      expect(output.props.selectable).toBe(true)
      expect(screen.getByLabelText('External embed thumbnail')).toBeTruthy()
    } finally {
      unmount()
      store.destroy()
    }
  })
})
