import React from 'react'
import {act, fireEvent, render} from '../../../../jest/test-utils'
import {NotificationsViewModel} from '../../../../src/state/models/notifications-view'
import {Feed} from '../../../../src/view/com/notifications/Feed'
import {mockedNotificationsStore} from '../../../../__mocks__/state-mock'

describe('Feed', () => {
  const mockedProps = {
    view: mockedNotificationsStore,
    onPressTryAgain: jest.fn(),
    onScroll: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it("doesn't render on missing data", async () => {
    const {findByTestId} = render(
      <Feed
        {...{
          view: {
            ...mockedNotificationsStore,
            isEmpty: true,
          } as NotificationsViewModel,
          onPressTryAgain: jest.fn(),
          onScroll: jest.fn(),
        }}
      />,
    )

    const feedFlatList = await findByTestId('feedFlatList')
    expect(feedFlatList).toBeTruthy()
    expect(feedFlatList.props.data).toContainEqual({
      _reactKey: '__empty__',
    })
  })

  it('renders button and retries on error', async () => {
    const tryAgainMock = jest.fn()
    const {findByTestId} = render(
      <Feed
        {...{
          view: {
            ...mockedNotificationsStore,
            hasError: true,
          } as NotificationsViewModel,
          onPressTryAgain: tryAgainMock,
          onScroll: jest.fn(),
        }}
      />,
    )

    const errorMessageTryAgainButton = await findByTestId(
      'errorMessageTryAgainButton',
    )
    expect(errorMessageTryAgainButton).toBeTruthy()

    fireEvent.press(errorMessageTryAgainButton)
    expect(tryAgainMock).toHaveBeenCalled()
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
    expect(mockedProps.view.loadMore).toHaveBeenCalled()
  })

  it("triggers refresh on triggerting flatlist' onRefresh", async () => {
    const {findByTestId} = render(<Feed {...mockedProps} />)

    const feedFlatList = await findByTestId('feedFlatList')
    expect(feedFlatList).toBeTruthy()

    await act(() => {
      feedFlatList.props.onRefresh()
    })
    expect(mockedProps.view.refresh).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<Feed {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
