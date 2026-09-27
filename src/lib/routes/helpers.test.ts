import {
  buildStateObject,
  getTabState,
  isCurrentProfileRoute,
  isStateAtTabRoot,
  TabState,
} from '#/lib/routes/helpers'
import {type State} from '#/lib/routes/types'

function asState(value: unknown) {
  return value as State
}

describe('native tab navigation state', () => {
  it.each([
    ['HomeTab', 'Home'],
    ['SearchTab', 'Search'],
    ['MessagesTab', 'Messages'],
    ['NotificationsTab', 'Notifications'],
    ['MyProfileTab', 'MyProfile'],
    ['FeedsTab', 'Feeds'],
    ['ListsTab', 'Lists'],
    ['BookmarksTab', 'Bookmarks'],
    ['SettingsTab', 'Settings'],
  ])('recognizes %s as the %s root', (tabRoute, screen) => {
    const state = asState(buildStateObject(tabRoute, screen, {}))

    expect(getTabState(state, screen)).toBe(TabState.InsideAtRoot)
    expect(isStateAtTabRoot(state)).toBe(true)
  })

  it('recognizes the own-profile route alias for sidebar selection', () => {
    expect(
      isCurrentProfileRoute({
        routeName: 'MyProfile',
        currentHandle: 'alice.test',
      }),
    ).toBe(true)
  })

  it('only selects a Profile route for the current account', () => {
    expect(
      isCurrentProfileRoute({
        routeName: 'Profile',
        profileName: 'alice.test',
        currentHandle: 'alice.test',
      }),
    ).toBe(true)
    expect(
      isCurrentProfileRoute({
        routeName: 'Profile',
        profileName: 'bob.test',
        currentHandle: 'alice.test',
      }),
    ).toBe(false)
  })

  it.each([
    ['HomeTab', 'Home'],
    ['SearchTab', 'Search'],
    ['MessagesTab', 'Messages'],
    ['NotificationsTab', 'Notifications'],
    ['MyProfileTab', 'MyProfile'],
    ['FeedsTab', 'Feeds'],
    ['ListsTab', 'Lists'],
    ['BookmarksTab', 'Bookmarks'],
    ['SettingsTab', 'Settings'],
  ])(
    'retains %s when a sidebar tab pushes another screen',
    (tabRoute, screen) => {
      const state = asState(
        buildStateObject(tabRoute, 'Profile', {name: 'alice.test'}),
      )

      expect(getTabState(state, screen)).toBe(TabState.Inside)
      expect(isStateAtTabRoot(state)).toBe(false)
    },
  )

  it('builds deep links directly into the matching sidebar tab', () => {
    for (const screen of ['Feeds', 'Lists', 'Bookmarks', 'Settings']) {
      const state = asState(buildStateObject(`${screen}Tab`, screen, {}))
      expect(getTabState(state, screen)).toBe(TabState.InsideAtRoot)
    }
  })

  it('does not confuse a detail screen in one tab with another tab', () => {
    const state = asState(
      buildStateObject('ListsTab', 'Profile', {name: 'alice.test'}),
    )

    expect(getTabState(state, 'Lists')).toBe(TabState.Inside)
    expect(getTabState(state, 'Settings')).toBe(TabState.Outside)
    expect(getTabState(state, 'MyProfile')).toBe(TabState.Outside)
  })

  it.each(['Feeds', 'Lists', 'Bookmarks', 'Settings'])(
    'does not treat the legacy %s common screen inside HomeTab as a tab root',
    screen => {
      const state = asState(buildStateObject('HomeTab', screen, {}))

      expect(isStateAtTabRoot(state)).toBe(false)
      expect(getTabState(state, screen)).toBe(TabState.Outside)
    },
  )
})
