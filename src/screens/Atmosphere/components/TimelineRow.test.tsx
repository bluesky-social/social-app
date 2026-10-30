import {i18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {I18nProvider} from '@lingui/react'
import {act, render} from '@testing-library/react-native'

import {TimelineRow} from '#/screens/Atmosphere/components/TimelineRow'
import {
  createActivity,
  createRow,
  present,
} from '#/screens/Atmosphere/testFixtures'
import {type ActivityTimelineListItem} from '#/screens/Atmosphere/timeline'

jest.mock('#/alf', () => ({
  atoms: {relative: {position: 'relative'}, border_t: {borderTopWidth: 1}},
  useTheme: () => ({
    atoms: {
      border_contrast_low: {borderColor: '#ddd'},
      text_contrast_medium: {color: '#666'},
    },
  }),
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('./ActivityPresentationRow', () => ({
  ActivityPresentationRow: () => null,
}))

const earlierToday = msg`Earlier today`
const props = present(createRow([createActivity()]))
function element(layout: NonNullable<ActivityTimelineListItem['layout']>) {
  return (
    <I18nProvider i18n={i18n}>
      <TimelineRow {...props} layout={layout} />
    </I18nProvider>
  )
}
beforeEach(() => i18n.loadAndActivate({locale: 'en', messages: {}}))
afterEach(() => act(() => i18n.loadAndActivate({locale: 'en', messages: {}})))

it('shows and removes a separator as the row leaves a footnote run', () => {
  const screen = render(element({kind: 'footnote', gap: 8, separator: true}))
  expect(screen.getByTestId('atmosphereTimelineSeparator')).toBeTruthy()
  expect(screen.queryByTestId('atmosphereDateHeading')).toBeNull()

  screen.rerender(element({kind: 'footnote', gap: 8, separator: false}))
  expect(screen.queryByTestId('atmosphereTimelineSeparator')).toBeNull()
})

it('renders heading semantics and updates translated labels without remounting', () => {
  const layout = {
    kind: 'footnote' as const,
    gap: 24,
    separator: false,
    heading: {
      kind: 'today' as const,
      key: '2026-09-11',
      date: new Date(2026, 8, 11, 6),
    },
  }
  const screen = render(element(layout))
  expect(screen.getByRole('header')).toHaveTextContent('Earlier today')
  act(() =>
    i18n.loadAndActivate({
      locale: 'fr',
      messages: {[earlierToday.id]: 'Plus tôt aujourd’hui'},
    }),
  )
  expect(screen.getByRole('header')).toHaveTextContent('Plus tôt aujourd’hui')
  screen.rerender(
    element({...layout, heading: {...layout.heading, kind: 'yesterday'}}),
  )
  expect(screen.getByRole('header')).toHaveTextContent('Yesterday')
})

it('formats older dates in the active locale and supports long RTL date text', () => {
  const date = new Date(2026, 8, 8, 12)
  const layout = {
    kind: 'footnote' as const,
    gap: 24,
    separator: false,
    heading: {kind: 'older' as const, key: '2026-09-08', date},
  }
  const screen = render(element(layout))
  const options = {year: 'numeric', month: 'long', day: 'numeric'} as const
  expect(screen.getByRole('header')).toHaveTextContent(i18n.date(date, options))
  act(() => i18n.loadAndActivate({locale: 'ar', messages: {}}))
  expect(screen.getByRole('header')).toHaveTextContent(i18n.date(date, options))
  expect(screen.getByRole('header').props.numberOfLines).toBeUndefined()
})
