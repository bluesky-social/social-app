import React from 'react'
import {cleanup, render} from '../../../../jest/test-utils'
import {PostThreadViewModel} from '../../../../src/state/models/post-thread-view'
import {PostThread} from '../../../../src/view/com/post-thread/PostThread'
import {mockedPostThreadViewStore} from '../../../../__mocks__/state-mock'

describe('PostThread', () => {
  const mockedProps = {
    uri: 'testuri',
    view: mockedPostThreadViewStore,
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ActivityIndicator on loading', async () => {
    const {findByTestId} = render(
      <PostThread
        {...{
          ...mockedProps,
          view: {
            ...mockedPostThreadViewStore,
            isLoading: true,
          } as PostThreadViewModel,
        }}
      />,
    )

    const postThreadLoadingView = await findByTestId('postThreadLoadingView')
    expect(postThreadLoadingView).toBeTruthy()
  })

  it('renders ErrorMessage on error', async () => {
    const {findByTestId} = render(
      <PostThread
        {...{
          ...mockedProps,
          view: {
            ...mockedPostThreadViewStore,
            hasError: true,
          } as PostThreadViewModel,
        }}
      />,
    )

    const errorMessageView = await findByTestId('errorMessageView')
    expect(errorMessageView).toBeTruthy()
  })
})
