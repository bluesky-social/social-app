import React from 'react'
import {Home} from '../../../src/view/screens/Home'
import renderer, {act} from 'react-test-renderer'
import {render} from '../../../jest/test-utils'
import {mockedMeStore, mockedRootStore} from '../../../__mocks__/state-mock'
import {AppState} from 'react-native'

describe('Home', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  it('polls feed', async () => {
    const appStateSpy = jest.spyOn(AppState, 'addEventListener')
    const consoleErrorSpy = jest.spyOn(console, 'error')

    render(<Home {...mockedProps} />)

    // Changes AppState to active
    act(() => {
      appStateSpy.mock.calls[0][1]('active')
    })
    await jest.runOnlyPendingTimers()

    expect(mockedMeStore.mainFeed.checkForLatest).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenLastCalledWith(
      'Failed to poll feed',
      'Error checking for latest',
    )
  })

  it('renders feed', async () => {
    const {findByTestId} = render(<Home {...mockedProps} />)
    const feed = await findByTestId('homeFeed')

    expect(feed).toBeTruthy()
  })

  it('renders button when hasNewLatest', async () => {
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

    const button = await findByTestId('loadLatestButton')
    expect(button).toBeTruthy()
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<Home {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
