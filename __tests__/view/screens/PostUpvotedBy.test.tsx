import React from 'react'
import {PostUpvotedBy} from '../../../src/view/screens/PostUpvotedBy'
import {cleanup, render} from '../../../jest/test-utils'

describe('PostUpvotedBy', () => {
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
    const page = render(<PostUpvotedBy {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
