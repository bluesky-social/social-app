import React from 'react'
import {NotFound} from '../../../src/view/screens/NotFound'
import renderer from 'react-test-renderer'
import {fireEvent, render} from '../../../jest/test-utils'
import {mockedNavigationStore} from '../../../__mocks__/state-mock'

describe('NotFound', () => {
  it('renders not found screen', async () => {
    const {findByTestId} = render(<NotFound />)
    const notFoundView = await findByTestId('notFoundView')

    expect(notFoundView).toBeTruthy()
  })

  it('navigates home', async () => {
    const navigationSpy = jest.spyOn(mockedNavigationStore, 'navigate')
    const {getByTestId} = render(<NotFound />)
    const navigateHomeButton = getByTestId('navigateHomeButton')

    fireEvent.press(navigateHomeButton)

    expect(navigationSpy).toHaveBeenCalledWith('/')
  })

  it('matches snapshot', () => {
    const tree = renderer.create(<NotFound />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
