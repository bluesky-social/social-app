import React from 'react'
import {ProfileFollows} from '../../../src/view/screens/ProfileFollows'
import {cleanup, render} from '../../../jest/test-utils'

describe('ProfileFollows', () => {
  jest.useFakeTimers()
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {
      name: 'test name',
    },
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('matches snapshot', () => {
    const page = render(<ProfileFollows {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
