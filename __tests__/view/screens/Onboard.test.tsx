import React from 'react'
import {Onboard} from '../../../src/view/screens/Onboard'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Onboard', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<Onboard />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
