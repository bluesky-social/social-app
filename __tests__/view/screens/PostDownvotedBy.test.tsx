import React from 'react'
import {PostDownvotedBy} from '../../../src/view/screens/PostDownvotedBy'
import {cleanup, render} from '../../../jest/test-utils'

describe('PostDownvotedBy', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
      rkey: '123123123',
    },
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('matches snapshot', () => {
    const page = render(<PostDownvotedBy {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
