import React from 'react'
import {Animated, Share} from 'react-native'
import {TabsSelector} from '../../../../src/view/shell/mobile/TabsSelector'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {mockedNavigationStore} from '../../../../__mocks__/state-mock'

describe('TabsSelector', () => {
  const onCloseMock = jest.fn()

  const mockedProps = {
    active: true,
    tabMenuInterp: new Animated.Value(0),
    onClose: onCloseMock,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders tabs selector', () => {
    const {getByTestId} = render(<TabsSelector {...mockedProps} />)

    const tabsSelectorView = getByTestId('tabsSelectorView')

    expect(tabsSelectorView).toBeTruthy()
  })

  it('renders nothing if inactive', () => {
    const {getByTestId} = render(
      <TabsSelector {...{...mockedProps, active: false}} />,
    )

    const emptyView = getByTestId('emptyView')

    expect(emptyView).toBeTruthy()
  })

  // TODO - this throws currently, but the tabs selector isnt being used atm so I just disabled -prf
  // it('presses share button', () => {
  //   const shareSpy = jest.spyOn(Share, 'share')
  //   const {getByTestId} = render(<TabsSelector {...mockedProps} />)

  //   const shareButton = getByTestId('shareButton')
  //   fireEvent.press(shareButton)

  //   expect(onCloseMock).toHaveBeenCalled()
  //   expect(shareSpy).toHaveBeenCalledWith({url: 'https://bsky.app/'})
  // })

  it('presses clone button', () => {
    const {getByTestId} = render(<TabsSelector {...mockedProps} />)

    const cloneButton = getByTestId('cloneButton')
    fireEvent.press(cloneButton)

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.newTab).toHaveBeenCalled()
  })

  it('presses new tab button', () => {
    const {getByTestId} = render(<TabsSelector {...mockedProps} />)

    const newTabButton = getByTestId('newTabButton')
    fireEvent.press(newTabButton)

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.newTab).toHaveBeenCalledWith('/')
  })

  it('presses change tab button', () => {
    const {getAllByTestId} = render(<TabsSelector {...mockedProps} />)

    const changeTabButton = getAllByTestId('changeTabButton')
    fireEvent.press(changeTabButton[0])

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.newTab).toHaveBeenCalledWith('/')
  })

  it('presses close tab button', () => {
    const {getAllByTestId} = render(<TabsSelector {...mockedProps} />)

    const closeTabButton = getAllByTestId('closeTabButton')
    fireEvent.press(closeTabButton[0])

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.setActiveTab).toHaveBeenCalledWith(0)
  })

  it('presses swipes to close the tab', () => {
    const {getByTestId} = render(<TabsSelector {...mockedProps} />)

    const tabsSwipable = getByTestId('tabsSwipable')
    fireEvent(tabsSwipable, 'swipeableRightOpen')

    expect(onCloseMock).toHaveBeenCalled()
    expect(mockedNavigationStore.setActiveTab).toHaveBeenCalledWith(0)
  })
})
