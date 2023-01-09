import React from 'react'
import {render} from '../../../../jest/test-utils'
import {FeedItem} from '../../../../src/view/com/notifications/FeedItem'
import {mockedNotificationsViewItemModel} from '../../../../__mocks__/state-mock'

describe('FeedItem', () => {
  const mockedProps = {
    item: mockedNotificationsViewItemModel,
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('matches snapshot', () => {
    const page = render(<FeedItem {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
