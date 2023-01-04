import React from 'react'
import {SuggestedFollows} from '../../../../src/view/com/discover/SuggestedFollows'
import {act, fireEvent, render} from '../../../../jest/test-utils'
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
    jest.spyOn(React, 'useMemo').mockReturnValueOnce(mockedSuggestedActorsStore)
    const spyOnFollow = jest.spyOn(apilib, 'follow').mockResolvedValue({
      uri: '',
      cid: '',
    })

    const {queryByTestId, findAllByTestId} = render(
      <SuggestedFollows {...mockedProps} />,
    )

    const followButton = await findAllByTestId('followButton')
    expect(followButton).toBeTruthy()

    let unfollowButton = queryByTestId('unfollowButton')
    expect(unfollowButton).toBeFalsy()

    fireEvent.press(followButton[0])
    expect(spyOnFollow).toHaveBeenCalled()
  })
  // WIP
  // it('renders and uses unfollow button', async () => {
  //   jest.spyOn(React, 'useMemo').mockReturnValueOnce(mockedSuggestedActorsStore)
  //   jest.spyOn(React, 'useState').mockReturnValueOnce([{'1': true}, jest.fn()])
  //   const spyOnUnfollow = jest.spyOn(apilib, 'unfollow').mockResolvedValue()

  //   const {findAllByTestId} = render(<SuggestedFollows {...mockedProps} />)

  //   const unfollowButton = await findAllByTestId('unfollowButton')
  //   expect(unfollowButton).toBeTruthy()

  //   fireEvent.press(unfollowButton[0])
  //   expect(spyOnUnfollow).toHaveBeenCalled()
  // })

  it('matches snapshot', () => {
    const page = render(<SuggestedFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
