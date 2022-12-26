import React from 'react'
import {Profile} from '../../../src/view/screens/Profile'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Profile', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      user: 'test.user',
    },
    visible: true,
  }
  it('matches snapshot', () => {
    const tree = renderer.create(<Profile {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<Profile {...mockedProps} />)
  })
})
