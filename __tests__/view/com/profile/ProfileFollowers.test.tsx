import React from 'react'
import {fireEvent, render} from '../../../../jest/test-utils'
import {ProfileFollowers} from '../../../../src/view/com/profile/ProfileFollowers'
import {
  mockedLogStore,
  mockedUserFollowersStore,
} from '../../../../__mocks__/state-mock'

describe('ProfileFollowers', () => {
  const mockedProps = {
    name: 'test user',
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders activity indicator', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedUserFollowersStore, jest.fn()])
    const {findByTestId} = render(<ProfileFollowers name="test user 2" />)

    const profileFollowersActivityIndicatorView = await findByTestId(
      'profileFollowersActivityIndicatorView',
    )
    expect(profileFollowersActivityIndicatorView).toBeTruthy()
  })

  it('catches setup error', async () => {
    jest.spyOn(React, 'useState').mockReturnValue([
      {
        ...mockedUserFollowersStore,
        setup: jest.fn().mockRejectedValue(''),
        hasError: true,
      },
      jest.fn(),
    ])

    const {findByTestId} = render(<ProfileFollowers {...mockedProps} />)
    expect(mockedLogStore.error).toHaveBeenCalled()

    const tryAgainButton = await findByTestId('tryAgainButton')
    expect(tryAgainButton).toBeTruthy()
    fireEvent.press(tryAgainButton)

    expect(mockedUserFollowersStore.refresh).toHaveBeenCalled()
  })

  it('renders list', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedUserFollowersStore, jest.fn()])
    const {findByTestId} = render(<ProfileFollowers {...mockedProps} />)

    const profileFollowersFlatList = await findByTestId(
      'profileFollowersFlatList',
    )
    expect(profileFollowersFlatList).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<ProfileFollowers {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
