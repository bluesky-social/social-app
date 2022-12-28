import React from 'react'
// import {MobileShell} from '../../../../src/view/shell/mobile'
// import renderer from 'react-test-renderer'
// import {SafeAreaProvider} from 'react-native-safe-area-context'
// import {render} from '../../../../jest/test-utils'

describe('MobileShell', () => {
  beforeAll(() => {
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {close: jest.fn(), expand: jest.fn()},
    })
    jest.useFakeTimers()
  })

  // it('renders mobile shell', () => {
  //   const {getByTestId} = render(<MobileShell />)

  //   const noSessionView = getByTestId('noSessionView')

  //   expect(noSessionView).toBeTruthy()
  // })

  // noSessionView
  // onboardOuterView
  // mobileShellView

  it('matches snapshot', () => {
    //   const tree = renderer
    //     .create(
    //       <SafeAreaProvider>
    //         <MobileShell />
    //       </SafeAreaProvider>,
    //     )
    //     .toJSON()
    //   expect(tree).toMatchSnapshot()
  })
})
