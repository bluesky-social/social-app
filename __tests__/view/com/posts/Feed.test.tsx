import React from 'react'
import {act, cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {FeedModel} from '../../../../src/state/models/feed-view'
import {Feed} from '../../../../src/view/com/posts/Feed'
import {mockedFeedStore} from '../../../../__mocks__/state-mock'

describe('Feed', () => {
  const mockedProps = {
    feed: mockedFeedStore,
    onPressCompose: jest.fn(),
    onPressTryAgain: jest.fn(),
    onScroll: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ErrorMessage on error', async () => {
    const {findByTestId} = render(
      <Feed
        {...{
          ...mockedProps,
          feed: {...mockedFeedStore, hasError: true} as FeedModel,
        }}
      />,
    )
    const errorMessageTryAgainButton = await findByTestId(
      'errorMessageTryAgainButton',
    )
    expect(errorMessageTryAgainButton).toBeTruthy()
  })

  it('renders compose prompt', async () => {
    const {findByTestId} = render(
      <Feed
        {...{
          ...mockedProps,
          feed: {...mockedFeedStore, hasLoaded: false} as FeedModel,
        }}
      />,
    )

    const composePromptButton = await findByTestId('composePromptButton')
    expect(composePromptButton).toBeTruthy()

    fireEvent.press(composePromptButton)
    expect(mockedProps.onPressCompose).toHaveBeenCalled()
  })

  it('renders loading footer', async () => {
    const {findByTestId} = render(
      <Feed
        {...{
          ...mockedProps,
          feed: {...mockedFeedStore, isLoading: true} as FeedModel,
        }}
      />,
    )

    const isLoadingFooter = await findByTestId('isLoadingFooter')
    expect(isLoadingFooter).toBeTruthy()
  })

  it("triggers refresh on triggerting flatlist' onRefresh", async () => {
    const {findByTestId} = render(<Feed {...mockedProps} />)

    const feedFlatList = await findByTestId('feedFlatList')
    expect(feedFlatList).toBeTruthy()

    await act(() => {
      feedFlatList.props.onRefresh()
    })
    expect(mockedProps.feed.refresh).toHaveBeenCalled()
  })

  it("triggers loadMore on reaching flatlist' bottom", async () => {
    const {findByTestId} = render(<Feed {...mockedProps} />)

    const feedFlatList = await findByTestId('feedFlatList')
    expect(feedFlatList).toBeTruthy()

    fireEvent.scroll(feedFlatList, {
      nativeEvent: {
        contentSize: {height: 600, width: 400},
        contentOffset: {y: 600, x: 0},
        layoutMeasurement: {height: 100, width: 100},
      },
    })
    expect(mockedProps.feed.loadMore).toHaveBeenCalled()
  })

  it('renders empty feed', async () => {
    const {findByTestId} = render(
      <Feed
        {...{
          ...mockedProps,
          feed: {...mockedFeedStore, isEmpty: true} as FeedModel,
        }}
      />,
    )

    const feedFlatList = await findByTestId('feedFlatList')
    expect(feedFlatList.props.data).toContainEqual({
      _reactKey: '__empty__',
    })
  })
})
