import React from 'react'
import {ProfileMembers} from '../../../src/view/screens/ProfileMembers'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('ProfileMembers', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<ProfileMembers {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
