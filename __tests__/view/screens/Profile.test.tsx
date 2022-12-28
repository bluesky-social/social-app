import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import {render} from '../../../jest/test-utils'
import {
  mockedProfileStore,
  mockedProfileUiStore,
} from '../../../__mocks__/state-mock'

describe('Profile', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      user: 'test.user',
    },
    visible: true,
  }

  beforeEach(() => {
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedProfileUiStore)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders profile screen', async () => {
    const {findByTestId} = render(<Profile {...mockedProps} />)
    const profileView = await findByTestId('profileView')

    expect(profileView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('test name')
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

  // it('matches snapshot', () => {
  //   const page = render(<Profile {...mockedProps} />)
  //   expect(page).toMatchSnapshot()
  // })
})
