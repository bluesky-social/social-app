import React from 'react'
import {cleanup, render} from '../../../../jest/test-utils'
import {PostVotedBy} from '../../../../src/view/com/post-thread/PostVotedBy'
import {mockedVotesViewStore} from '../../../../__mocks__/state-mock'

describe('PostVotedtedBy', () => {
  const mockedProps = {
    uri: 'testuri',
    direction: 'up' as 'up' | 'down',
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ActivityIndicator on loading', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([{...mockedVotesViewStore, isLoading: true}, jest.fn()])

    const {findByTestId} = render(<PostVotedBy {...mockedProps} />)
    const postVotedByLoadingView = await findByTestId('postVotedByLoadingView')
    expect(postVotedByLoadingView).toBeTruthy()
  })

  it('renders ErrorMessage on error', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([{...mockedVotesViewStore, hasError: true}, jest.fn()])

    const {findByTestId} = render(<PostVotedBy {...mockedProps} />)
    const errorMessageView = await findByTestId('errorMessageView')
    expect(errorMessageView).toBeTruthy()
  })

  it('renders correctly', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedVotesViewStore, jest.fn()])

    const {findByTestId} = render(<PostVotedBy {...mockedProps} />)
    const postVotedByView = await findByTestId('postVotedByView')
    expect(postVotedByView).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<PostVotedBy {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
