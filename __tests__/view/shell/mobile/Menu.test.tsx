import React from 'react'
import {Menu} from '../../../../src/view/shell/mobile/Menu'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {
  mockedNavigationStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('Menu', () => {
  const onCloseMock = jest.fn()

  const mockedProps = {
    visible: true,
    onClose: onCloseMock,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders menu', () => {
    const {getByTestId} = render(<Menu {...mockedProps} />)

    const menuView = getByTestId('menuView')

    expect(menuView).toBeTruthy()
  })

  it('presses profile card button', () => {
    const {getByTestId} = render(<Menu {...mockedProps} />)

    const profileCardButton = getByTestId('profileCardButton')
    fireEvent.press(profileCardButton)

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.switchTo).toHaveBeenCalledWith(0, true)
  })

  it('presses search button', () => {
    const {getByTestId} = render(<Menu {...mockedProps} />)

    const searchBtn = getByTestId('searchBtn')
    fireEvent.press(searchBtn)

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.switchTo).toHaveBeenCalledWith(0, true)
    expect(mockedNavigationStore.navigate).toHaveBeenCalledWith('/search')
  })

  it("presses notifications menu item' button", () => {
    const {getAllByTestId} = render(<Menu {...mockedProps} />)

    const menuItemButton = getAllByTestId('menuItemButton')
    fireEvent.press(menuItemButton[1])

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.switchTo).toHaveBeenCalledWith(1, true)
  })

  it('presses new scene button', () => {
    const {getAllByTestId} = render(<Menu {...mockedProps} />)

    const menuItemButton = getAllByTestId('menuItemButton')
    fireEvent.press(menuItemButton[3])

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedShellStore.openModal).toHaveBeenCalled()
  })
})
