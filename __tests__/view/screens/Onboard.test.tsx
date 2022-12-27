import React from 'react'
import {Onboard} from '../../../src/view/screens/Onboard'
import renderer from 'react-test-renderer'
import {render} from '../../../jest/test-utils'

describe('Onboard', () => {
  jest.useFakeTimers()

  it('renders onboard screen', async () => {
    const {findByTestId} = render(<Onboard />)
    const onboardView = await findByTestId('onboardView')

    expect(onboardView).toBeTruthy()
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<Onboard />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
