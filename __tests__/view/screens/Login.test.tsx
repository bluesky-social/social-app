import React from 'react'
import {Login} from '../../../src/view/screens/Login'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Login', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<Login />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
