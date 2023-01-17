import React from 'react'
import {Notifications} from '../../../src/view/screens/Notifications'
import {cleanup, render} from '../../../jest/test-utils'

describe('Notifications', () => {
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
    const page = render(<Notifications {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
