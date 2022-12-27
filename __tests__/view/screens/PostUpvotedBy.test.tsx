import React from 'react'
import {PostUpvotedBy} from '../../../src/view/screens/PostUpvotedBy'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('PostUpvotedBy', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }

  it('renders upvoted by screen', async () => {
    const {findByTestId} = render(<PostUpvotedBy {...mockedProps} />)
    const postUpvotedByView = await findByTestId('postUpvotedByView')

    expect(postUpvotedByView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Upvoted by')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<PostUpvotedBy {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
