import React from 'react'
import {Settings} from '../../../src/view/screens/Settings'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Settings', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  it('renders settings screen', async () => {
    const {findByTestId} = render(<Settings {...mockedProps} />)
    const settingsView = await findByTestId('settingsView')

    expect(settingsView).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Settings')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<Settings {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
