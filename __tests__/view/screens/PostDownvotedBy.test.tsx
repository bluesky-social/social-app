import React from 'react'
import {PostDownvotedBy} from '../../../src/view/screens/PostDownvotedBy'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('PostDownvotedBy', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<PostDownvotedBy {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
