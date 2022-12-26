import React from 'react'
import {Search} from '../../../src/view/screens/Search'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Search', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }
  it('matches snapshot', () => {
    const tree = renderer.create(<Search {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('tests', () => {
    render(<Search {...mockedProps} />)
  })
})
