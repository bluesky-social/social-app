import {render, screen} from '@testing-library/react-native'

import {$output} from '#/lexicons/tools/ozone/inbox/getAccountStatus'
import {AccountStatus} from '../AccountStatus'
import {getHasActiveStrikes} from '../util/accountData'

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

it('shows strike explanations only when the account has active strikes', () => {
  const data = $output.schema.parse({
    src: 'did:plc:moderator',
    standing: 'warning',
    updatedAt: '2026-01-01T00:00:00.000Z',
    hasActiveStrikes: true,
  })
  const {rerender} = render(
    <AccountStatus
      status="warning"
      enforcement={{state: 'none'}}
      hasActiveStrikes={getHasActiveStrikes(data)}
    />,
  )
  expect(
    screen.getAllByText('Your account has strikes against it'),
  ).toHaveLength(2)
  expect(
    screen.getByText(/strikes have been added to your record/),
  ).toBeTruthy()

  rerender(<AccountStatus status="warning" enforcement={{state: 'none'}} />)
  expect(screen.queryByText(/strikes/i)).toBeNull()

  rerender(
    <AccountStatus
      status="atRisk"
      enforcement={{state: 'none'}}
      hasActiveStrikes
    />,
  )
  expect(screen.getByText(/record now carries enough strikes/)).toBeTruthy()

  rerender(<AccountStatus status="atRisk" enforcement={{state: 'takendown'}} />)
  expect(screen.queryByText(/strikes/i)).toBeNull()
  rerender(
    <AccountStatus
      status="atRisk"
      enforcement={{state: 'takendown'}}
      hasActiveStrikes
    />,
  )
  expect(
    screen.getByText(/Strikes come off your record over time/),
  ).toBeTruthy()
  expect(screen.queryByText(/record now carries enough strikes/)).toBeNull()
})
