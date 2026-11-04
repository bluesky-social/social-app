import {render, screen} from '@testing-library/react-native'

import {AccountSubjectPreview} from '../ReportSubjectPreview/AccountSubjectPreview'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
    i18n: {date: () => 'a date'},
  }),
}))
jest.mock('#/alf', () => ({atoms: {text_sm: {}, text_md: {}}}))
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock(
  '#/screens/ModerationInbox/components/hooks/useSubjectPreviewProfile',
  () => ({
    useSubjectPreviewProfile: () => ({query: {isPending: false}}),
  }),
)
jest.mock('../ReportSubjectPreview/PreviewContent', () => {
  const {Text, View} = jest.requireActual('react-native')
  return {
    PreviewContent: ({
      title,
      children,
    }: {
      title: string
      children: React.ReactNode
    }) => (
      <View>
        <Text>{title}</Text>
        {children}
      </View>
    ),
  }
})

it('uses the available profile name and handle when the live account is unavailable', () => {
  render(
    <AccountSubjectPreview
      did="did:plc:owner"
      account={{
        handle: 'user.test',
        profile: {
          $type: 'app.bsky.actor.profile',
          displayName: 'User',
          avatar: {},
        },
      }}
    />,
  )
  expect(screen.getByText('User')).toBeTruthy()
  expect(screen.getByText(/@user\.test/)).toBeTruthy()
})

it('shows the DID when profile information is unavailable', () => {
  render(<AccountSubjectPreview did="did:plc:owner" />)
  expect(screen.getByText('did:plc:owner')).toBeTruthy()
})
