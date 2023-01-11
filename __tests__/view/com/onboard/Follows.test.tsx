import React from 'react'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {Follows} from '../../../../src/view/com/onboard/Follows'
import {mockedOnboardStore} from '../../../../__mocks__/state-mock'

describe('Follows', () => {
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders and clicks skip button', async () => {
    const {findByTestId} = render(<Follows />)

    const followsSkipButton = await findByTestId('followsSkipButton')
    expect(followsSkipButton).toBeTruthy()

    fireEvent.press(followsSkipButton)
    expect(mockedOnboardStore.next).toHaveBeenCalled()
  })

  it('renders and clicks next button', async () => {
    const {findByTestId} = render(<Follows />)

    const followsNextButton = await findByTestId('followsNextButton')
    expect(followsNextButton).toBeTruthy()

    fireEvent.press(followsNextButton)
    expect(mockedOnboardStore.next).toHaveBeenCalled()
  })

  it('matches snapshot', () => {
    const page = render(<Follows />)
    expect(page).toMatchSnapshot()
  })
})
