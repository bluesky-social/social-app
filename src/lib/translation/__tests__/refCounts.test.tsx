import {Text} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {NavigationContext} from '@react-navigation/native'
import {act, render, screen} from '@testing-library/react-native'

import {Provider, useTranslate} from '#/lib/translation'

const POST = 'at://did:plc:alice/app.bsky.feed.post/1'

const mockProviderRender = jest.fn()
let mockResolveTranslation: (result: unknown) => void = () => {}

jest.mock('@bsky.app/expo-translate-text', () => ({
  onTranslateTask: () =>
    new Promise(resolve => {
      mockResolveTranslation = resolve
    }),
}))
jest.mock('#/env', () => ({
  IS_ANDROID: true,
  IS_IOS: false,
  IS_TRANSLATION_SUPPORTED: true,
}))
jest.mock('#/analytics', () => {
  const ax = {metric: () => {}}
  return {useAnalytics: () => ax}
})
jest.mock('#/lib/hooks/useGoogleTranslate', () => {
  const googleTranslate = async () => {}
  return {useGoogleTranslate: () => googleTranslate}
})
jest.mock('#/state/preferences', () => {
  const langPrefs = {appLanguage: 'en'}
  return {
    useLanguagePrefs: () => {
      mockProviderRender()
      return langPrefs
    },
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})

type Navigation = React.ContextType<typeof NavigationContext>

/**
 * The slice of a screen's navigation object that `useFocusEffect` relies on.
 */
function createScreen({focused}: {focused: boolean}) {
  const listeners = {focus: new Set<() => void>(), blur: new Set<() => void>()}
  return {
    navigation: {
      isFocused: () => focused,
      addListener: (type: 'focus' | 'blur', listener: () => void) => {
        listeners[type].add(listener)
        return () => listeners[type].delete(listener)
      },
    } as unknown as Navigation,
    emit(type: 'focus' | 'blur') {
      focused = type === 'focus'
      listeners[type].forEach(listener => listener())
    },
  }
}

let translate: ReturnType<typeof useTranslate>['translate']

function Post({testID, uri = POST}: {testID: string; uri?: string}) {
  const translation = useTranslate({key: uri})
  translate = translation.translate
  const {translationState} = translation
  return (
    <Text testID={testID}>
      {translationState.status === 'success'
        ? translationState.translatedText
        : translationState.status}
    </Text>
  )
}

function App({
  screens,
}: {
  screens: {name: string; navigation: Navigation; uris?: string[]}[]
}) {
  return (
    <I18nProvider i18n={i18n}>
      <Provider>
        {screens.map(({name, navigation, uris = [POST]}) => (
          <NavigationContext.Provider key={name} value={navigation}>
            {uris.map(uri => (
              <Post key={uri} testID={`${name}:${uri}`} uri={uri} />
            ))}
          </NavigationContext.Provider>
        ))}
      </Provider>
    </I18nProvider>
  )
}

function getStatus(name: string, uri = POST): unknown {
  return screen.getByTestId(`${name}:${uri}`).props.children
}

/**
 * Runs `callback`, then lets pending microtasks settle - the deferred prune of
 * unused translations among them.
 */
async function actAndSettle(callback: () => void) {
  await act(async () => {
    callback()
    await Promise.resolve()
  })
}

async function translatePost() {
  await actAndSettle(() => {
    void translate({text: 'hola', expectedTargetLanguage: 'en'})
  })
  await actAndSettle(() => {
    mockResolveTranslation({
      translatedTexts: 'hello',
      targetLanguage: 'en',
      sourceLanguage: 'es',
    })
  })
}

describe('translation ref counts', () => {
  it('keeps a translation when going back from a thread showing the same post', async () => {
    const feed = createScreen({focused: true})
    const thread = createScreen({focused: true})

    const {rerender} = render(
      <App screens={[{name: 'feed', navigation: feed.navigation}]} />,
    )
    await translatePost()
    expect(getStatus('feed')).toBe('hello')

    // Push the thread: it mounts focused, then the feed blurs.
    rerender(
      <App
        screens={[
          {name: 'feed', navigation: feed.navigation},
          {name: 'thread', navigation: thread.navigation},
        ]}
      />,
    )
    await actAndSettle(() => {
      feed.emit('blur')
    })
    expect(getStatus('thread')).toBe('hello')

    // Go back: React Navigation emits blur and then focus in the same tick.
    await actAndSettle(() => {
      thread.emit('blur')
      feed.emit('focus')
    })
    expect(getStatus('feed')).toBe('hello')
  })

  it('drops a translation once no focused screen shows the post', async () => {
    const feed = createScreen({focused: true})

    render(<App screens={[{name: 'feed', navigation: feed.navigation}]} />)
    await translatePost()
    expect(getStatus('feed')).toBe('hello')

    await actAndSettle(() => {
      feed.emit('blur')
    })
    await actAndSettle(() => {
      feed.emit('focus')
    })
    expect(getStatus('feed')).toBe('idle')
  })

  it('does not re-render the provider as posts mount and unmount', async () => {
    const feed = createScreen({focused: true})
    const uris = [1, 2, 3, 4].map(
      n => `at://did:plc:bob/app.bsky.feed.post/${n}`,
    )
    const renderFeed = (visible: string[]) => (
      <App
        screens={[{name: 'feed', navigation: feed.navigation, uris: visible}]}
      />
    )

    const {rerender} = render(renderFeed(uris.slice(0, 2)))
    // The root re-renders the provider once per `rerender` call.
    mockProviderRender.mockClear()
    await actAndSettle(() => {
      rerender(renderFeed(uris.slice(1, 3)))
    })
    await actAndSettle(() => {
      rerender(renderFeed(uris.slice(2, 4)))
    })
    expect(mockProviderRender).toHaveBeenCalledTimes(2)
  })
})
