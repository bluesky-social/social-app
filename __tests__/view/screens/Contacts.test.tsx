import React from 'react'
import {Contacts} from '../../../src/view/screens/Contacts'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('Contacts', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }
  it('renders correctly', () => {
    const tree = renderer.create(<Contacts {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
