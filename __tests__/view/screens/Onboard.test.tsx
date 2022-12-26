import React from 'react'
import {Onboard} from '../../../src/view/screens/Onboard'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Onboard', () => {
  jest.useFakeTimers()
  it('matches snapshot', () => {
    const tree = renderer.create(<Onboard />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<Onboard />)
  })
})
