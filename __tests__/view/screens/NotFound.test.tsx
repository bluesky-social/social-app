import React from 'react'
import {NotFound} from '../../../src/view/screens/NotFound'
import renderer from 'react-test-renderer'
// import {render} from '../../../../jest/test-utils'

describe('NotFound', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<NotFound />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
