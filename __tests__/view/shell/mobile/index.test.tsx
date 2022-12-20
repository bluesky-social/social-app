import React from 'react'
import {MobileShell} from '../../../../src/view/shell/mobile'
import {render} from '../../../../jest/test-utils'

it('MobileShell renders correctly', () => {
  const tree = render(<MobileShell />)
  expect(tree).toMatchSnapshot()
})
