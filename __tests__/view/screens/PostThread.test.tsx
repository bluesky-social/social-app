import React from 'react'
import {PostThread} from '../../../src/view/screens/PostThread'
import {cleanup, render} from '../../../jest/test-utils'

describe('PostThread', () => {
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
    const page = render(<PostThread {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
