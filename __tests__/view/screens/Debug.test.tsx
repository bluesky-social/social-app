import React from 'react'
import {Debug} from '../../../src/view/screens/Debug'
import {cleanup, render} from '../../../jest/test-utils'

describe('Debug', () => {
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('matches snapshot', () => {
    const page = render(<Debug />)
    expect(page).toMatchSnapshot()
  })
})
