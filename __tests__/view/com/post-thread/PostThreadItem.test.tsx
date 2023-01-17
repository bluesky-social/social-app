import React from 'react'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {PostThreadViewPostModel} from '../../../../src/state/models/post-thread-view'
import {PostThreadItem} from '../../../../src/view/com/post-thread/PostThreadItem'
import {
  mockedPostThreadViewPostStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('PostThreadItem', () => {
  const mockedProps = {
    item: mockedPostThreadViewPostStore,
    onPostReply: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ErrorMessage on lack of post record', async () => {
    const {findByTestId} = render(
      <PostThreadItem
        {...{
          ...mockedProps,
          // @ts-expect-error
          item: {
            ...mockedPostThreadViewPostStore,
            postRecord: null,
          } as PostThreadViewPostModel,
        }}
      />,
    )

    const errorMessageView = await findByTestId('errorMessageView')
    expect(errorMessageView).toBeTruthy()
  })

  it('renders isHighlightedPost view', async () => {
    const {findByTestId, queryByTestId} = render(
      <PostThreadItem
        {...{
          ...mockedProps,
          item: {
            ...mockedPostThreadViewPostStore,
            _isHighlightedPost: true,
          } as PostThreadViewPostModel,
        }}
      />,
    )

    const isNotHighlightedPostView = queryByTestId('isNotHighlightedPostView')
    expect(isNotHighlightedPostView).toBeFalsy()

    const isHighlightedPostView = await findByTestId('isHighlightedPostView')
    expect(isHighlightedPostView).toBeTruthy()
  })

  it("doesn't render isHighlightedPost view", async () => {
    const {findByTestId, queryByTestId} = render(
      <PostThreadItem {...mockedProps} />,
    )

    const isNotHighlightedPostView = await findByTestId(
      'isNotHighlightedPostView',
    )
    expect(isNotHighlightedPostView).toBeTruthy()

    const isHighlightedPostView = queryByTestId('isHighlightedPostView')
    expect(isHighlightedPostView).toBeFalsy()
  })

  it('renders and clicks reply button', async () => {
    const {findByTestId} = render(<PostThreadItem {...mockedProps} />)
    const postCtrlsReplyButton = await findByTestId('postCtrlsReplyButton')
    expect(postCtrlsReplyButton).toBeTruthy()

    fireEvent.press(postCtrlsReplyButton)
    expect(mockedShellStore.openComposer).toHaveBeenCalled()
  })

  it('renders and presses repost button', async () => {
    const {findByTestId} = render(<PostThreadItem {...mockedProps} />)

    const postCtrlsToggleRepostButton = await findByTestId(
      'postCtrlsToggleRepostButton',
    )
    expect(postCtrlsToggleRepostButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleRepostButton)
    expect(mockedPostThreadViewPostStore.toggleRepost).toHaveBeenCalled()
  })

  it('renders and presses upvote button', async () => {
    const {findByTestId} = render(<PostThreadItem {...mockedProps} />)

    const postCtrlsToggleUpvoteButton = await findByTestId(
      'postCtrlsToggleUpvoteButton',
    )
    expect(postCtrlsToggleUpvoteButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleUpvoteButton)
    expect(mockedPostThreadViewPostStore.toggleUpvote).toHaveBeenCalled()
  })
})
