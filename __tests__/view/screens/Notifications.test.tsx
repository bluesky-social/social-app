import React from 'react'
import {Notifications} from '../../../src/view/screens/Notifications'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Notifications', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }
  it('matches snapshot', () => {
    const tree = renderer.create(<Notifications {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<Notifications {...mockedProps} />)
  })
})
