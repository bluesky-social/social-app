import {useLingui} from '@lingui/react/macro'
import {
  HotkeysProvider,
  useHotkeys,
  useHotkeysContext,
} from 'react-hotkeys-hook'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {emitFocusSearch, emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {navigate} from '#/Navigation'

enum Hotkeys {
  OPEN_COMPOSER = 'n',
  FOCUS_SEARCH = 'slash',
  REFRESH_FEED = '.',
  GO_TO_CHAT = 'g>c',
  GO_TO_EXPLORE = 'g>e',
  GO_TO_NOTIFICATIONS = 'g>n',
  GO_TO_SAVED = 'g>d',
  GO_TO_PROFILE = 'g>p',
  GO_TO_SETTINGS = 'g>s',
  GO_TO_LISTS = 'g>l',
  GO_TO_FEEDS = 'g>f',
  GO_TO_HOME = 'g>h',
}

export function Provider({children}: React.PropsWithChildren<unknown>) {
  return (
    <HotkeysProvider initiallyActiveScopes={['global']}>
      <KeyboardShortcuts>{children}</KeyboardShortcuts>
    </HotkeysProvider>
  )
}

export {useHotkeysContext}

function KeyboardShortcuts({children}: React.PropsWithChildren<unknown>) {
  useKeyboardShortcuts()
  return children
}

function useKeyboardShortcuts() {
  const {openComposer} = useOpenComposer()
  const {hasSession, currentAccount} = useSession()
  const {t: l} = useLingui()

  const shouldIgnore = (requiresSession: boolean = false) => {
    if (requiresSession && !hasSession) {
      return true
    }

    return false
  }

  const handleKey = (
    callback: () => void,
    options?: {requiresSession?: boolean},
  ) => {
    if (shouldIgnore(options?.requiresSession)) {
      return
    }
    callback()
  }

  useHotkeys(
    Hotkeys.OPEN_COMPOSER,
    () =>
      handleKey(
        () => {
          openComposer({logContext: 'Other'})
        },
        {
          requiresSession: true,
        },
      ),
    {scopes: ['global'], description: l`Compose new post`},
    [openComposer],
  )

  useHotkeys(Hotkeys.FOCUS_SEARCH, () => handleKey(emitFocusSearch), {
    scopes: ['global'],
    preventDefault: true,
    description: l`Focus the search field`,
    useKey: true, // Support international and alternate keyboard layouts
  })

  useHotkeys(Hotkeys.REFRESH_FEED, () => handleKey(emitSoftReset), {
    scopes: ['global'],
    description: l`Refresh the current feed`,
    useKey: true, // Support international and alternate keyboard layouts
  })

  const navigationHotkeyOptions = {
    scopes: ['global'],
    useKey: true,
  }

  useHotkeys(
    Hotkeys.GO_TO_CHAT,
    () =>
      handleKey(() => void navigate('Messages', {}), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Chat`},
  )

  useHotkeys(
    Hotkeys.GO_TO_EXPLORE,
    () => handleKey(() => void navigate('Search', {}), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Explore`},
  )

  useHotkeys(
    Hotkeys.GO_TO_NOTIFICATIONS,
    () =>
      handleKey(() => void navigate('Notifications'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Notifications`},
  )

  useHotkeys(
    Hotkeys.GO_TO_SAVED,
    () => handleKey(() => void navigate('Bookmarks'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Saved`},
  )

  useHotkeys(
    Hotkeys.GO_TO_PROFILE,
    () =>
      handleKey(
        () => void navigate('Profile', {name: currentAccount!.handle}),
        {requiresSession: true},
      ),
    {...navigationHotkeyOptions, description: l`Open Profile`},
  )

  useHotkeys(
    Hotkeys.GO_TO_SETTINGS,
    () => handleKey(() => void navigate('Settings'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Settings`},
  )

  useHotkeys(
    Hotkeys.GO_TO_LISTS,
    () => handleKey(() => void navigate('Lists'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Lists`},
  )

  useHotkeys(
    Hotkeys.GO_TO_FEEDS,
    () => handleKey(() => void navigate('Feeds'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Feeds`},
  )

  useHotkeys(
    Hotkeys.GO_TO_HOME,
    () => handleKey(() => void navigate('Home'), {requiresSession: true}),
    {...navigationHotkeyOptions, description: l`Open Home`},
  )
}
