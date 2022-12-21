import React from 'react'
import {Login} from '../../../src/view/screens/Login'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Login', () => {
  const mockedProps = {
    navIdx: [0, 0],
    params: null,
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<Login {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
