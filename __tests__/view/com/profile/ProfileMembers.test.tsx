import React from 'react'
import {cleanup, render} from '../../../../jest/test-utils'
import {ProfileMembers} from '../../../../src/view/com/profile/ProfileMembers'
import {
  mockedLogStore,
  mockedMembersStore,
} from '../../../../__mocks__/state-mock'

describe('ProfileMembers', () => {
  const mockedProps = {
    name: 'test actor',
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders activity indicator', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedMembersStore, jest.fn()])
    const {findByTestId} = render(<ProfileMembers name="test user 2" />)

    const profileMembersActivityIndicatorView = await findByTestId(
      'profileMembersActivityIndicatorView',
    )
    expect(profileMembersActivityIndicatorView).toBeTruthy()
  })

  it('catches setup error', async () => {
    jest.spyOn(React, 'useState').mockReturnValue([
      {
        ...mockedMembersStore,
        setup: jest.fn().mockRejectedValue(''),
        hasError: true,
      },
      jest.fn(),
    ])

    const {findByTestId} = render(<ProfileMembers {...mockedProps} />)
    expect(mockedLogStore.error).toHaveBeenCalled()

    const errorMessageTryAgainButton = await findByTestId(
      'errorMessageTryAgainButton',
    )
    expect(errorMessageTryAgainButton).toBeTruthy()
  })

  it('renders list', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedMembersStore, jest.fn()])
    const {findByTestId} = render(<ProfileMembers {...mockedProps} />)

    const profileMembersFlatList = await findByTestId('profileMembersFlatList')
    expect(profileMembersFlatList).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<ProfileMembers {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
