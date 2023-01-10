import React from 'react'
import {Log} from '../../../src/view/screens/Log'
import {render} from '../../../jest/test-utils'

describe('Log', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('matches snapshot', () => {
    const page = render(<Log {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
