import React from 'react'
import {ProfileFollowers} from '../../../src/view/screens/ProfileFollowers'
import {cleanup, render} from '../../../jest/test-utils'

describe('ProfileFollowers', () => {
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
    const page = render(<ProfileFollowers {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
