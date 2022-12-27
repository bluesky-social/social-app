import React from 'react'
import {PostDownvotedBy} from '../../../src/view/screens/PostDownvotedBy'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('PostDownvotedBy', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }

  it('renders downvoted by screen', async () => {
    const {findByTestId} = render(<PostDownvotedBy {...mockedProps} />)
    const postDownvotedByView = await findByTestId('postDownvotedByView')

    expect(postDownvotedByView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Downvoted by')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<PostDownvotedBy {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
