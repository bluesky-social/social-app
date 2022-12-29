import React from 'react'
import {Search} from '../../../src/view/screens/Search'
import {fireEvent, render} from '../../../jest/test-utils'

describe('Search', () => {
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
  })

  it('renders search screen', async () => {
    const {findByTestId} = render(<Search {...mockedProps} />)
    const searchScreen = await findByTestId('searchScreen')

    expect(searchScreen).toBeTruthy()

    const headerTitle = await findByTestId('headerTitle')
    expect(headerTitle.props.children).toBe('Search')
  })

  it('renders with query', async () => {
    const {findByTestId} = render(<Search {...mockedProps} />)
    const searchTextInput = await findByTestId('searchTextInput')

    expect(searchTextInput).toBeTruthy()
    fireEvent.changeText(searchTextInput, 'test')

    const searchScrollView = await findByTestId('searchScrollView')
    expect(searchScrollView).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<Search {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
