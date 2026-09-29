import {describe, expect, jest, test} from '@jest/globals'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))
jest.mock('#/state/queries/post', () => ({useGetPost: () => jest.fn()}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
/* Ships untransformed ESM that jest's transformIgnorePatterns excludes. */
jest.mock('@bsky.app/react-native-uitextview', () => {
  const {Text} = require('react-native') as typeof import('react-native')
  return {UITextView: Text}
})

/*
 * Reproduce the native Dialog ownership model: Dialog.Outer renders its
 * children through the real bottom-sheet portal group, so they mount under an
 * outlet at the root of the test tree - outside any screen-local provider -
 * exactly like BottomSheetOutlet in the app shell. A plain nested render
 * would hide missing-context crashes (the reproduced iOS redbox); this
 * harness cannot.
 */
jest.mock('#/components/Dialog', () => {
  const React = require('react') as typeof import('react')
  const {TextInput, View} =
    require('react-native') as typeof import('react-native')
  const {createPortalGroup_INTERNAL} =
    require('#/../modules/bottom-sheet/src/lib/Portal') as typeof import('#/../modules/bottom-sheet/src/lib/Portal')
  const portal = createPortalGroup_INTERNAL()
  return {
    __portal: portal,
    useDialogControl: () => ({
      id: 'test-dialog',
      ref: {current: null},
      open: jest.fn(),
      close: (cb?: () => void) => cb?.(),
    }),
    useDialogContext: () => ({close: (cb?: () => void) => cb?.()}),
    Outer: ({children}: {children: React.ReactNode}) =>
      React.createElement(portal.Portal, null, children),
    Handle: () => null,
    Close: () => null,
    ScrollableInner: ({children}: {children: React.ReactNode}) =>
      React.createElement(View, null, children),
    Input: (props: object) => React.createElement(TextInput, props),
  }
})

import {type LinkResolvers} from '#/lib/api/resolve'
import {AttachUrlDialogButton} from '#/view/screens/DebugComposer/components/RecordAttachControls'
import {
  ThreadStoreProvider,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {createThreadStore} from '#/components/ComposerV2/store'
import * as Dialog from '#/components/Dialog'

const portal = (Dialog as unknown as {__portal: PortalGroup}).__portal

type PortalGroup = {
  Provider: React.ComponentType<{children: React.ReactNode}>
  Outlet: React.ComponentType
  Portal: React.ComponentType<{children: React.ReactNode}>
}

const i18n = setupI18n({locale: 'en', messages: {en: {}}})

function makeStore() {
  return createThreadStore({
    resolvers: {} as LinkResolvers,
    __createId: () => 'post-1',
    initialState: {posts: [{text: ''}]},
  })
}

function Harness({
  store,
  children,
}: {
  store: ReturnType<typeof makeStore>
  children: React.ReactNode
}) {
  return (
    <I18nProvider i18n={i18n}>
      <portal.Provider>
        {/* The screen subtree owns the store... */}
        <ThreadStoreProvider store={store}>{children}</ThreadStoreProvider>
        {/* ...while dialog content mounts here, outside it, like the shell. */}
        <portal.Outlet />
      </portal.Provider>
    </I18nProvider>
  )
}

describe('tester dialogs under native portalling', () => {
  test('harness sanity: portalled children do not inherit the screen provider', () => {
    function Probe() {
      useThreadStore()
      return null
    }
    const Portal = portal.Portal
    /* Silence React's error boundary noise for the expected throw. */
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() =>
        render(
          <Harness store={makeStore()}>
            <Portal>
              <Probe />
            </Portal>
          </Harness>,
        ),
      ).toThrow('useThreadStore must be used inside a <ThreadStoreProvider>')
    } finally {
      spy.mockRestore()
    }
  })

  test('attach-url dialog content reads and updates the owning store', () => {
    const store = makeStore()
    const addUri = jest
      .spyOn(store.actions, 'addUri')
      .mockImplementation(() => {})

    render(
      <Harness store={store}>
        <AttachUrlDialogButton postId="post-1" index={0} />
      </Harness>,
    )

    /* The portalled content rendered without a missing-context crash. */
    const input = screen.getByTestId('composerV2Tester-attach-url-input')
    fireEvent.changeText(input, 'https://example.com')
    fireEvent.press(screen.getByTestId('composerV2Tester-attach-url-resolve'))

    /*
     * The dialog dispatched into the same store instance owned by the screen
     * subtree - the component never constructs a store of its own.
     */
    expect(addUri).toHaveBeenCalledTimes(1)
    expect(addUri).toHaveBeenCalledWith('post-1', 'https://example.com')
  })
})
