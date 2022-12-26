import React from 'react'
import {ProfileFollowers} from '../../../src/view/screens/ProfileFollowers'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('ProfileFollowers', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }
  it('matches snapshot', () => {
    const tree = renderer.create(<ProfileFollowers {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<ProfileFollowers {...mockedProps} />)
  })
})
