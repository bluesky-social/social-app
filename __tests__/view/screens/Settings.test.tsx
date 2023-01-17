import React from 'react'
import {Settings} from '../../../src/view/screens/Settings'
import {cleanup, render} from '../../../jest/test-utils'

describe('Settings', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('matches snapshot', () => {
    const page = render(<Settings {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
