import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import {cleanup, render} from '../../../jest/test-utils'
import {
  mockedFeedStore,
  mockedMembershipsStore,
  mockedMembersStore,
  mockedProfileStore,
  mockedProfileUiStore,
} from '../../../__mocks__/state-mock'
import {Sections} from '../../../src/state/models/profile-ui'

describe('Profile', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      user: 'test.user',
    },
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders profile screen', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedProfileUiStore)
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const profileView = await findByTestId('profileView')

    expect(profileView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('testhandle')
  })

  it('renders error screen on error', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      profile: {
        ...mockedProfileStore,
        hasLoaded: true,
        hasError: jest.fn().mockReturnValue(true),
        error: 'error',
      },
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const profileErrorScreen = await findByTestId('profileErrorScreen')
    const profileErrorDetails = await findByTestId('profileErrorScreen-details')

    expect(profileErrorScreen).toBeTruthy()
    expect(profileErrorDetails.props.children).toBe('error')
  })

  it('renders loading placeholder when isInitialLoading', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      isInitialLoading: true,
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')

    expect(viewSelectorFlatList).toBeTruthy()
    expect(viewSelectorFlatList.props.data).toContainEqual({
      _reactKey: '__loading__',
    })
  })

  it('renders non reply feed when posts section is selected', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedProfileUiStore)
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')

    expect(viewSelectorFlatList).toBeTruthy()
    expect(viewSelectorFlatList.props.data[2]).toBe(
      mockedFeedStore.nonReplyFeed[0],
    )
  })

  it('triggers slice funcion when posts sections is not selected', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Trending,
    })
    // @ts-expect-error
    const sliceSpy = jest.spyOn(mockedFeedStore.feed, 'slice')

    render(<Profile {...mockedProps} />)

    expect(sliceSpy).toHaveBeenCalled()
  })

  it('renders end of feed when it has no more items', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      feed: {
        ...mockedFeedStore,
        hasMore: false,
      },
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)

    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')
    expect(viewSelectorFlatList.props.data).toContainEqual({
      _reactKey: '__end__',
    })

    const endOfFeed = await findByTestId('endOfFeed')
    expect(endOfFeed).toBeTruthy()
  })

  it('renders state when it has no feed (posts)', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      feed: {
        ...mockedFeedStore,
        hasContent: false,
        isEmpty: true,
      },
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)

    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')
    expect(viewSelectorFlatList.props.data).toContainEqual({
      _reactKey: '__empty__',
    })

    const emptyStateView = await findByTestId('emptyStateView')
    expect(emptyStateView).toBeTruthy()
  })

  it('triggers slice funcion when scenes are selected', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Scenes,
    })
    // @ts-expect-error
    const sliceSpy = jest.spyOn(mockedMembershipsStore.memberships, 'slice')

    render(<Profile {...mockedProps} />)

    expect(sliceSpy).toHaveBeenCalled()
  })

  it('renders state when it has no feed (scenes)', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Scenes,
      memberships: {
        ...mockedMembershipsStore,
        hasContent: false,
        isEmpty: true,
      },
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)

    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')
    expect(viewSelectorFlatList.props.data).toContainEqual({
      _reactKey: '__empty__',
    })

    const emptyStateView = await findByTestId('emptyStateView')
    expect(emptyStateView).toBeTruthy()
  })

  it('triggers slice funcion when members are selected', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Members,
    })
    // @ts-expect-error
    const sliceSpy = jest.spyOn(mockedMembersStore.members, 'slice')

    render(<Profile {...mockedProps} />)

    expect(sliceSpy).toHaveBeenCalled()
  })

  it('renders state when it has no feed (members)', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Members,
      members: {
        ...mockedMembersStore,
        hasContent: false,
        isEmpty: true,
      },
    })
    const {findByTestId} = render(<Profile {...mockedProps} />)

    const viewSelectorFlatList = await findByTestId('viewSelectorFlatList')
    expect(viewSelectorFlatList.props.data).toContainEqual({
      _reactKey: '__empty__',
    })

    const emptyStateView = await findByTestId('emptyStateView')
    expect(emptyStateView).toBeTruthy()
  })

  it('renders as scene creator', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedProfileUiStore,
      selectedView: Sections.Members,
      isScene: true,
      profile: {
        ...mockedProfileStore,
      },
    })

    const {findByTestId} = render(<Profile {...mockedProps} />)
    const shouldAdminButton = await findByTestId('shouldAdminButton')

    expect(shouldAdminButton).toBeTruthy()
  })
})
