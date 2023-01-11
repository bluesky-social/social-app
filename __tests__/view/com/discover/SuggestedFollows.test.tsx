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
    const followSpy = jest.spyOn(apilib, 'follow').mockResolvedValue({
      uri: 'test uri',
      cid: '',
    })
    const unfollowSpy = jest.spyOn(apilib, 'unfollow').mockResolvedValue()

    const {findAllByTestId, queryByTestId, findByTestId} = render(
      <SuggestedFollows {...mockedProps} />,
    )

    const followButton = await findAllByTestId('followButton')
    expect(followButton).toBeTruthy()

    let unfollowButton = queryByTestId('unfollowButton')
    expect(unfollowButton).toBeFalsy()

    fireEvent.press(followButton[0])
    expect(followSpy).toHaveBeenCalled()

    unfollowButton = await findByTestId('unfollowButton')
    expect(unfollowButton).toBeTruthy()
    fireEvent.press(unfollowButton)
    expect(unfollowSpy).toHaveBeenCalled()
  })

  it('renders error message', async () => {
    const setupMock = jest.fn().mockResolvedValue({})
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedSuggestedActorsStore,
      hasError: true,
      setup: setupMock,
    })

    const {findByTestId} = render(<SuggestedFollows {...mockedProps} />)
    const errorScreenTryAgainButton = await findByTestId(
      'errorScreenTryAgainButton',
    )
    expect(errorScreenTryAgainButton).toBeTruthy()

    fireEvent.press(errorScreenTryAgainButton)
    expect(setupMock).toHaveBeenCalled()
  })

  it('renders no suggestions', async () => {
    jest.spyOn(React, 'useMemo').mockReturnValue({
      ...mockedSuggestedActorsStore,
      hasContent: false,
    })

    render(<SuggestedFollows {...mockedProps} />)
    expect(mockedProps.onNoSuggestions).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<SuggestedFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
