import React from 'react'
import {Animated} from 'react-native'
import {TabsSelector} from '../../../../src/view/shell/mobile/TabsSelector'
import {render} from '../../../../jest/test-utils'

it('TabsSelector renders correctly', () => {
  const mockedProps = {
    active: true,
    tabMenuInterp: new Animated.Value(0),
    onClose: jest.fn(),
  }
  const tree = render(<TabsSelector {...mockedProps} />)
  expect(tree).toMatchSnapshot()
})
