import React from 'react'
import {Settings} from '../../../src/view/screens/Settings'
import {render} from '../../../jest/test-utils'

describe('Settings', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders settings screen', async () => {
    const {findByTestId} = render(<Settings {...mockedProps} />)
    const settingsView = await findByTestId('settingsView')

    expect(settingsView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Settings')
  })

  it('matches snapshot', () => {
    const page = render(<Settings {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
