import React from 'react'
import {fireEvent, render} from '../../../jest/test-utils'
import {Home} from '../../../src/view/screens/Home'
import {mockedRootStore, mockedShellStore} from '../../../__mocks__/state-mock'

describe('useOnMainScroll', () => {
  const mockedProps = {
    navIdx: '0-0',
    params: {},
    visible: true,
  }

  it('toggles minimalShellMode to true', () => {
    jest.useFakeTimers()
    const {getByTestId} = render(<Home {...mockedProps} />)

    fireEvent.scroll(getByTestId('homeFeed'), {
      nativeEvent: {
        contentOffset: {y: 20},
        contentSize: {height: 100},
        layoutMeasurement: {height: 50},
      },
    })

    expect(mockedRootStore.shell.setMinimalShellMode).toHaveBeenCalledWith(true)
  })

  it('toggles minimalShellMode to false', () => {
    jest.useFakeTimers()
    const {getByTestId} = render(<Home {...mockedProps} />, {
      ...mockedRootStore,
      shell: {
        ...mockedShellStore,
        minimalShellMode: true,
      },
    })

    fireEvent.scroll(getByTestId('homeFeed'), {
      nativeEvent: {
        contentOffset: {y: 0},
        contentSize: {height: 100},
        layoutMeasurement: {height: 50},
      },
    })
    expect(mockedRootStore.shell.setMinimalShellMode).toHaveBeenCalledWith(
      false,
    )
  })
})
