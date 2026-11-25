import {type HandleString} from '@atproto/syntax'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {render} from '@testing-library/react-native'

import {useSetPostTitle} from '#/lib/hooks/useSetPostTitle'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {type app} from '#/lexicons'

const DID = 'did:plc:7r7oxqovttrrcgzsy24ogise'
// What the route options in src/Navigation.tsx produce for a DID URL.
const ROUTE_TITLE = `Post by @${DID} — Bluesky`

jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: () => undefined,
}))

type Author = app.bsky.actor.defs.ProfileViewBasic

const Stack = createNativeStackNavigator<CommonNavigatorParams>()

function authorWith(handle: HandleString): Author {
  return {did: DID, handle}
}

function PostScreen({author}: {author?: Author}) {
  useSetPostTitle(author)
  return null
}

function renderPostScreen(author?: Author) {
  const navigationRef = createNavigationContainerRef<CommonNavigatorParams>()
  render(
    <I18nProvider i18n={i18n}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen
            name="PostThread"
            initialParams={{name: DID, rkey: '3mzcxu73eg22h'}}
            options={{title: ROUTE_TITLE}}>
            {() => <PostScreen author={author} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </I18nProvider>,
  )
  return navigationRef
}

beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

describe('useSetPostTitle', () => {
  it("titles the post with its author's handle", () => {
    const navigation = renderPostScreen(authorWith('ironeconomist.bsky.social'))
    expect(navigation.getCurrentOptions()).toMatchObject({
      title: 'Post by @ironeconomist.bsky.social — Bluesky',
    })
  })

  it('keeps the route title when the author handle is invalid', () => {
    const navigation = renderPostScreen(authorWith('handle.invalid'))
    expect(navigation.getCurrentOptions()).toMatchObject({title: ROUTE_TITLE})
  })

  it('keeps the route title until the author is known', () => {
    const navigation = renderPostScreen(undefined)
    expect(navigation.getCurrentOptions()).toMatchObject({title: ROUTE_TITLE})
  })
})
