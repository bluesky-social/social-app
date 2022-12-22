import React from 'react'
import {Home} from '../../../src/view/screens/Home'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Home', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<Home {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
