import React from 'react'
import {cleanup, render} from '../../../../jest/test-utils'
import {PostRepostedBy} from '../../../../src/view/com/post-thread/PostRepostedBy'
import {mockedRepostedByViewStore} from '../../../../__mocks__/state-mock'

describe('PostRepostedBy', () => {
  const mockedProps = {
    uri: 'testuri',
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ActivityIndicator on loading', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([
        {...mockedRepostedByViewStore, isLoading: true},
        jest.fn(),
      ])

    const {findByTestId} = render(<PostRepostedBy {...mockedProps} />)
    const postRepostedByLoadingView = await findByTestId(
      'postRepostedByLoadingView',
    )
    expect(postRepostedByLoadingView).toBeTruthy()
  })

  it('renders ErrorMessage on error', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([
        {...mockedRepostedByViewStore, hasError: true},
        jest.fn(),
      ])

    const {findByTestId} = render(<PostRepostedBy {...mockedProps} />)
    const errorMessageView = await findByTestId('errorMessageView')
    expect(errorMessageView).toBeTruthy()
  })

  it('renders correctly', async () => {
    jest
      .spyOn(React, 'useState')
      .mockReturnValue([mockedRepostedByViewStore, jest.fn()])

    const {findByTestId} = render(<PostRepostedBy {...mockedProps} />)
    const postRepostedByView = await findByTestId('postRepostedByView')
    expect(postRepostedByView).toBeTruthy()
  })
})
