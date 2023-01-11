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

  it('renders notifications screen', async () => {
    const {findByTestId} = render(<Notifications {...mockedProps} />)
    const notificationsView = await findByTestId('notificationsView')

    expect(notificationsView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Notifications')
  })

  it('matches snapshot', () => {
    const page = render(<Notifications {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
