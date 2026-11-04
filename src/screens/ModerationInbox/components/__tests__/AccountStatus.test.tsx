import {render, screen} from '@testing-library/react-native'

import {AccountStatus} from '../AccountStatus'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
    i18n: {date: () => 'a date'},
  }),
  Trans: ({message}: {message: string}) => message,
}))
jest.mock('#/state/queries/moderation-inbox', () => ({
  useUpdateModerationInboxSeenMutation: () => ({mutate: jest.fn()}),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/alf', () => ({
  atoms: {},
  useTheme: () => ({
    palette: {negative_500: 'red', yellow: 'yellow'},
    atoms: {border_contrast_low: {}, text_contrast_medium: {}},
  }),
}))
jest.mock('#/components/icons/Chevron', () => ({
  ChevronRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Circle', () => ({
  CircleInfo_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/ExclamationCircle', () => ({
  ExclamationCircle_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Prompt', () => {
  const {Text, View} = jest.requireActual('react-native')
  return {
    usePromptControl: () => ({open: jest.fn(), close: jest.fn()}),
    Outer: View,
    Content: View,
    TitleText: Text,
    DescriptionText: Text,
    Actions: View,
    Action: () => null,
  }
})

it('shows an active account takedown as a suspension', () => {
  render(<AccountStatus status="atRisk" enforcement={{state: 'takendown'}} />)
  expect(
    screen.getAllByText('Your account has been suspended').length,
  ).toBeGreaterThan(0)
  expect(
    screen.queryByText('Your account is at risk of permanent suspension'),
  ).toBeNull()
})

it('distinguishes a temporary suspension from strike risk', () => {
  const {rerender} = render(
    <AccountStatus status="atRisk" enforcement={{state: 'suspended'}} />,
  )
  expect(
    screen.getAllByText('Your account is temporarily suspended').length,
  ).toBeGreaterThan(0)
  rerender(<AccountStatus status="atRisk" enforcement={{state: 'none'}} />)
  expect(
    screen.getAllByText('Your account is at risk of permanent suspension')
      .length,
  ).toBeGreaterThan(0)
})

it('uses neutral copy until enforcement data is available', () => {
  render(<AccountStatus status="atRisk" />)
  expect(
    screen.getAllByText(
      'Your account may be suspended or at risk of suspension',
    ).length,
  ).toBeGreaterThan(0)
})
