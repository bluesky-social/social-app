import React from 'react'
import {NotFound} from '../../../src/view/screens/NotFound'
import {cleanup, fireEvent, render} from '../../../jest/test-utils'
import {mockedNavigationStore} from '../../../__mocks__/state-mock'

describe('NotFound', () => {
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('navigates home', async () => {
    const navigationSpy = jest.spyOn(mockedNavigationStore, 'navigate')
    const {getByTestId} = render(<NotFound />)
    const navigateHomeButton = getByTestId('navigateHomeButton')

    fireEvent.press(navigateHomeButton)

    expect(navigationSpy).toHaveBeenCalledWith('/')
  })
})
