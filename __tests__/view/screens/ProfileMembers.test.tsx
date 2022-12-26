import React from 'react'
import {ProfileMembers} from '../../../src/view/screens/ProfileMembers'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('ProfileMembers', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }
  it('matches snapshot', () => {
    const tree = renderer.create(<ProfileMembers {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<ProfileMembers {...mockedProps} />)
  })
})
