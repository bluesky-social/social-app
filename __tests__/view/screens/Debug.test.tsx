import React from 'react'
import {Debug} from '../../../src/view/screens/Debug'
import {render} from '../../../jest/test-utils'

describe('Debug', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('matches snapshot', () => {
    const page = render(<Debug />)
    expect(page).toMatchSnapshot()
  })
})
