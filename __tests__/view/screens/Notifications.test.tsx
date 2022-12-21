import React from 'react'
import {Notifications} from '../../../src/view/screens/Notifications'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Notifications', () => {
  const mockedProps = {
    navIdx: [0, 0],
    params: null,
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<Notifications {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
