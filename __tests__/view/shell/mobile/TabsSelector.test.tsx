import React from 'react'
import {Animated} from 'react-native'
import renderer from 'react-test-renderer'
import {TabsSelector} from '../../../../src/view/shell/mobile/TabsSelector'
// import {render} from '../../../../jest/test-utils'

describe('TabsSelector', () => {
  const mockedProps = {
    active: true,
    tabMenuInterp: new Animated.Value(0),
    onClose: jest.fn(),
  }
  it('renders correctly', () => {
    const tree = renderer.create(<TabsSelector {...mockedProps} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
