import {render, screen} from '@testing-library/react-native'

import {ExploreSectionHeader} from '../ExploreSectionHeader'

jest.mock('#/alf', () => ({
  atoms: {text_lg: {}, font_semi_bold: {}},
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})

it('renders an accessible section heading without a see-more link', () => {
  render(<ExploreSectionHeader title="Featured articles" />)

  expect(screen.getByRole('header', {name: 'Featured articles'})).toBeTruthy()
  expect(screen.queryByText('See more')).toBeNull()
  expect(screen.queryByRole('link')).toBeNull()
})
