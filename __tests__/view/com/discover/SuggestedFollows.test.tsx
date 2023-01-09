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

  it('renders follow button', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue(mockedSuggestedActorsStore)
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

  // it('renders unfollow button', async () => {
  //   jest.spyOn(React, 'useMemo').mockReturnValue(mockedSuggestedActorsStore)
  //   const spyOnUnfollow = jest.spyOn(apilib, 'unfollow').mockResolvedValue()

  //   const {findAllByTestId, findByTestId} = render(
  //     <SuggestedFollows {...mockedProps} />,
  //   )

  //   const followButton = await findAllByTestId('followButton')
  //   expect(followButton).toBeTruthy()

  //   act(() => {
  //     fireEvent.press(followButton[0])
  //   })

  //   const unfollowButton = await findByTestId('unfollowButton')
  //   expect(unfollowButton).toBeTruthy()
  //   fireEvent.press(unfollowButton)
  //   expect(spyOnUnfollow).toHaveBeenCalled()
  // })

  it('matches snapshot', () => {
    const page = render(<SuggestedFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
