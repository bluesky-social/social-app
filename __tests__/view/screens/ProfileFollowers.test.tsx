import React from 'react'
import {ProfileFollowers} from '../../../src/view/screens/ProfileFollowers'
import {cleanup, render} from '../../../jest/test-utils'

describe('ProfileFollowers', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders followers screen', async () => {
    const {findByTestId} = render(<ProfileFollowers {...mockedProps} />)
    const profileFollowersView = await findByTestId('profileFollowersView')

    expect(profileFollowersView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Followers')
  })

  it('matches snapshot', () => {
    const page = render(<ProfileFollowers {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
