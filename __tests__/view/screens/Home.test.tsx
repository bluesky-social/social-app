import React from 'react'
import {Home} from '../../../src/view/screens/Home'
import {fireEvent, render, waitFor} from '../../../jest/test-utils'
import {
  mockedMeStore,
  mockedRootStore,
  mockedShellStore,
} from '../../../__mocks__/state-mock'
import {AppState} from 'react-native'

describe('Home', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders feed', async () => {
    const {findByTestId} = render(<Home {...mockedProps} />)
    const feed = await findByTestId('homeFeed')

    expect(feed).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Bluesky')
  })

  it('triggers polls feed', async () => {
    const appStateSpy = jest.spyOn(AppState, 'addEventListener')
    const consoleErrorSpy = jest.spyOn(console, 'error')

    render(<Home {...mockedProps} />)

    // Waits for AppState to change to active
    await waitFor(() => {
      appStateSpy.mock.calls[0][1]('active')
    })
    await jest.runOnlyPendingTimers()

    expect(mockedMeStore.mainFeed.checkForLatest).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('renders and clicks button when hasNewLatest', async () => {
    const {findByTestId} = render(<Home {...mockedProps} />, {
      ...mockedRootStore,
      me: {
        ...mockedMeStore,
        mainFeed: {
          ...mockedMeStore.mainFeed,
          hasNewLatest: true,
          isRefreshing: false,
        },
      },
    })

    const loadLatestButton = await findByTestId('loadLatestButton')
    expect(loadLatestButton).toBeTruthy()

    fireEvent.press(loadLatestButton)
    expect(mockedMeStore.mainFeed.refresh).toHaveBeenCalled()
  })

  it('renders and clicks try again button', async () => {
    const {findByTestId} = render(<Home {...mockedProps} />, {
      ...mockedRootStore,
      me: {
        ...mockedMeStore,
        mainFeed: {
          ...mockedMeStore.mainFeed,
          hasError: true,
        },
      },
    })

    const errorMessageTryAgainButton = await findByTestId(
      'errorMessageTryAgainButton',
    )
    expect(errorMessageTryAgainButton).toBeTruthy()

    fireEvent.press(errorMessageTryAgainButton)
    expect(mockedMeStore.mainFeed.refresh).toHaveBeenCalled()
  })

  it('renders and clicks open composer button', async () => {
    const {findByTestId} = render(<Home {...mockedProps} />)

    const composePromptButton = await findByTestId('composePromptButton')
    expect(composePromptButton).toBeTruthy()

    fireEvent.press(composePromptButton)
    expect(mockedShellStore.openComposer).toHaveBeenCalledWith({})
  })

  it('matches snapshot', () => {
    const page = render(<Home {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
