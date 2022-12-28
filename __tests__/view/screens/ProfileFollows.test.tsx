import React from 'react'
import {ProfileFollows} from '../../../src/view/screens/ProfileFollows'
import {render} from '../../../jest/test-utils'

describe('ProfileFollows', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }

  it('renders followed screen', async () => {
    const {findByTestId} = render(<ProfileFollows {...mockedProps} />)
    const profileFollowsView = await findByTestId('profileFollowsView')

    expect(profileFollowsView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Followed')
  })

  it('matches snapshot', () => {
    const page = render(<ProfileFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
