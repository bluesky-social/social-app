import React from 'react'
import {Onboard} from '../../../src/view/screens/Onboard'
import {cleanup, render} from '../../../jest/test-utils'

describe('Onboard', () => {
  jest.useFakeTimers()

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('matches snapshot', () => {
    const page = render(<Onboard />)
    expect(page).toMatchSnapshot()
  })
})
