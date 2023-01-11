import React from 'react'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {ProfileFollows} from '../../../../src/view/com/profile/ProfileFollows'
import {
  mockedLogStore,
  mockedUserFollowsStore,
} from '../../../../__mocks__/state-mock'

describe('ProfileFollows', () => {
  const mockedProps = {
    name: 'test user',
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders activity indicator', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedUserFollowsStore, jest.fn()])
    const {findByTestId} = render(<ProfileFollows name="test user 2" />)

    const profileFollowsActivityIndicatorView = await findByTestId(
      'profileFollowsActivityIndicatorView',
    )
    expect(profileFollowsActivityIndicatorView).toBeTruthy()
  })

  it('catches setup error', async () => {
    jest.spyOn(React, 'useState').mockReturnValue([
      {
        ...mockedUserFollowsStore,
        setup: jest.fn().mockRejectedValue(''),
        hasError: true,
      },
      jest.fn(),
    ])

    const {findByTestId} = render(<ProfileFollows {...mockedProps} />)
    expect(mockedLogStore.error).toHaveBeenCalled()

    const errorMessageTryAgainButton = await findByTestId(
      'errorMessageTryAgainButton',
    )
    expect(errorMessageTryAgainButton).toBeTruthy()
    fireEvent.press(errorMessageTryAgainButton)

    expect(mockedUserFollowsStore.refresh).toHaveBeenCalled()
  })

  it('renders list', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedUserFollowsStore, jest.fn()])
    const {findByTestId} = render(<ProfileFollows {...mockedProps} />)

    const profileFollowsFlatList = await findByTestId('profileFollowsFlatList')
    expect(profileFollowsFlatList).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<ProfileFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
