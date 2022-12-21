import React from 'react'
import {PostUpvotedBy} from '../../../src/view/screens/PostUpvotedBy'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('PostUpvotedBy', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<PostUpvotedBy {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
