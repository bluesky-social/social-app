import React from 'react'
import {Contacts} from '../../../src/view/screens/Contacts'
import {render} from '../../../jest/test-utils'
import {mockedMeStore, mockedRootStore} from '../../../__mocks__/state-mock'

describe('Contacts', () => {
  const mockedProps = {
    navIdx: [0, 0] as [number, number],
    params: {},
    visible: true,
  }

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('renders contacts page', () => {
    const {getByTestId} = render(<Contacts {...mockedProps} />)

    const title = getByTestId('contactsTitle')
    const textInput = getByTestId('contactsTextInput')

    expect(title).toBeTruthy()
    expect(textInput).toBeTruthy()
  })

  it('renders contacts page with handle profile follows list', () => {
    const {getByTestId} = render(<Contacts {...mockedProps} />, {
      ...mockedRootStore,
      me: {
        ...mockedMeStore,
        handle: 'test',
      },
    })
    expect(getByTestId('followList')).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<Contacts {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
