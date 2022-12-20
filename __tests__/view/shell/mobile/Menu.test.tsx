import React from 'react'
import {Menu} from '../../../../src/view/shell/mobile/Menu'
import {render} from '../../../../jest/test-utils'

it('Menu renders correctly', () => {
  const mockedProps = {
    visible: true,
    onClose: jest.fn(),
  }
  const tree = render(<Menu {...mockedProps} />)
  expect(tree).toMatchSnapshot()
})
