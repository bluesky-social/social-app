import React from 'react'
import {SuggestedFollows} from '../../../../src/view/com/discover/SuggestedFollows'
import {fireEvent, render} from '../../../../jest/test-utils'
import {mockedSuggestedActorsStore} from '../../../../__mocks__/state-mock'
import * as apilib from '../../../../src/state/lib/api'

describe('SuggestedFollows', () => {
  const mockedProps = {
    onNoSuggestions: jest.fn(),
    asLinks: true,
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders follow/unfollow buttons', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedSuggestedActorsStore)
    const spyOnFollow = jest.spyOn(apilib, 'follow').mockResolvedValue({
      uri: 'test uri',
      cid: '',
    })
    const spyOnUnfollow = jest.spyOn(apilib, 'unfollow').mockResolvedValue()

    const {findAllByTestId, queryByTestId, findByTestId} = render(
      <SuggestedFollows {...mockedProps} />,
    )

    const followButton = await findAllByTestId('followButton')
    expect(followButton).toBeTruthy()

    let unfollowButton = queryByTestId('unfollowButton')
    expect(unfollowButton).toBeFalsy()

    fireEvent.press(followButton[0])
    expect(spyOnFollow).toHaveBeenCalled()

    unfollowButton = await findByTestId('unfollowButton')
    expect(unfollowButton).toBeTruthy()
    fireEvent.press(unfollowButton)
    expect(spyOnUnfollow).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<SuggestedFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
