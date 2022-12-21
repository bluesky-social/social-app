import React from 'react'
import {Settings} from '../../../src/view/screens/Settings'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Settings', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<Settings {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
