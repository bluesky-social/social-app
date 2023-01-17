import React from 'react'
import {PostRepostedBy} from '../../../src/view/screens/PostRepostedBy'
import {cleanup, render} from '../../../jest/test-utils'

describe('PostRepostedBy', () => {
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
    const page = render(<PostRepostedBy {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
