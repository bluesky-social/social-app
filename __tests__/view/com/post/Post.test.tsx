import React from 'react'
import {fireEvent, render} from '../../../../jest/test-utils'
import {PostThreadViewModel} from '../../../../src/state/models/post-thread-view'
import {Post} from '../../../../src/view/com/post/Post'
import {
  mockedPostThreadViewModel,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('Post', () => {
  const mockedProps = {
    uri: 'testuri',
    initView: mockedPostThreadViewModel,
    showReplyLine: false,
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders ActivityIndicator when loading', async () => {
    const {findByTestId} = render(
      <Post
        {...{
          ...mockedProps,
          initView: {
            ...mockedPostThreadViewModel,
            isLoading: true,
          } as PostThreadViewModel,
        }}
      />,
    )

    const postLoading = await findByTestId('postLoading')
    expect(postLoading).toBeTruthy()
  })

  it('renders error message when it has an error', async () => {
    const {findByTestId} = render(
      <Post
        {...{
          ...mockedProps,
          initView: {
            ...mockedPostThreadViewModel,
            hasError: true,
          } as PostThreadViewModel,
        }}
      />,
    )

    const postError = await findByTestId('postError')
    expect(postError).toBeTruthy()
  })

  it('renders and clicks reply button', async () => {
    const {findByTestId} = render(<Post {...mockedProps} />)
    const postCtrlsReplyButton = await findByTestId('postCtrlsReplyButton')
    expect(postCtrlsReplyButton).toBeTruthy()

    fireEvent.press(postCtrlsReplyButton)
    expect(mockedShellStore.openComposer).toHaveBeenCalled()
  })

  it('renders and presses repost button', async () => {
    const {findByTestId} = render(<Post {...mockedProps} />)

    const postCtrlsToggleRepostButton = await findByTestId(
      'postCtrlsToggleRepostButton',
    )
    expect(postCtrlsToggleRepostButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleRepostButton)
    expect(mockedPostThreadViewModel.thread!.toggleRepost).toHaveBeenCalled()
  })

  it('renders and presses upvote button', async () => {
    const {findByTestId} = render(<Post {...mockedProps} />)

    const postCtrlsToggleUpvoteButton = await findByTestId(
      'postCtrlsToggleUpvoteButton',
    )
    expect(postCtrlsToggleUpvoteButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleUpvoteButton)
    expect(mockedPostThreadViewModel.thread!.toggleUpvote).toHaveBeenCalled()
  })

  it('renders muted view', async () => {
    const {findByTestId} = render(<Post {...mockedProps} />)

    const mutedPostView = await findByTestId('mutedPostView')
    expect(mutedPostView).toBeTruthy()
  })

  it('renders postShowReplyLine view', async () => {
    const {findByTestId} = render(
      <Post {...{...mockedProps, showReplyLine: true}} />,
    )

    const postShowReplyLineView = await findByTestId('postShowReplyLineView')
    expect(postShowReplyLineView).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<Post {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
