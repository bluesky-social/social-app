import React from 'react'
import {fireEvent, render} from '../../../../jest/test-utils'
import {FeedItem} from '../../../../src/view/com/posts/FeedItem'
import {
  mockedFeedItemStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('FeedItem', () => {
  const mockedProps = {
    item: mockedFeedItemStore,
    showReplyLine: false,
    ignoreMuteFor: '',
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders and presses reply button', async () => {
    const {findByTestId} = render(<FeedItem {...mockedProps} />)

    const postCtrlsReplyButton = await findByTestId('postCtrlsReplyButton')
    expect(postCtrlsReplyButton).toBeTruthy()

    fireEvent.press(postCtrlsReplyButton)
    expect(mockedShellStore.openComposer).toHaveBeenCalled()
  })

  it('renders and presses repost button', async () => {
    const {findByTestId} = render(<FeedItem {...mockedProps} />)

    const postCtrlsToggleRepostButton = await findByTestId(
      'postCtrlsToggleRepostButton',
    )
    expect(postCtrlsToggleRepostButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleRepostButton)
    expect(mockedFeedItemStore.toggleRepost).toHaveBeenCalled()
  })

  it('renders and presses upvote button', async () => {
    const {findByTestId} = render(<FeedItem {...mockedProps} />)

    const postCtrlsToggleUpvoteButton = await findByTestId(
      'postCtrlsToggleUpvoteButton',
    )
    expect(postCtrlsToggleUpvoteButton).toBeTruthy()

    fireEvent.press(postCtrlsToggleUpvoteButton)
    expect(mockedFeedItemStore.toggleUpvote).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<FeedItem {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
