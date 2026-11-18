import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {AtmosphereNux} from '#/screens/Atmosphere/components/AtmosphereNux'

jest.mock('#/state/queries/nuxs')
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('expo-linear-gradient', () => ({LinearGradient: () => null}))
jest.mock('#/components/GradientFill', () => ({GradientFill: () => null}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenDialog}),
}))
jest.mock('#/screens/Atmosphere/components/AboutAtmosphereDialog', () => ({
  AboutAtmosphereDialog: () => null,
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      onPress,
      testID,
      children,
    }: {
      label: string
      onPress: () => void
      testID?: string
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
    ButtonText: Text,
  }
})

const mockSave = jest.fn()
const mockMetric = jest.fn()
const mockOpenDialog = jest.fn()
const mockUseNux = jest.mocked(useNux)
const mockUseSaveNux = jest.mocked(useSaveNux)
const completedNux = {
  id: Nux.AtmosphereNux,
  completed: true,
  data: undefined,
}

function banner() {
  return (
    <I18nProvider i18n={i18n}>
      <AtmosphereNux style={{paddingTop: 16}} />
    </I18nProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  i18n.loadAndActivate({locale: 'en', messages: {}})
  mockUseNux.mockReturnValue({nux: undefined, status: 'ready'})
  mockUseSaveNux.mockReturnValue({mutate: mockSave} as never)
})

it('saves dismissal and hides immediately while the preference is saving', () => {
  const {rerender} = render(banner())

  fireEvent.press(screen.getByTestId('atmosphereNuxDismiss'))

  expect(mockSave).toHaveBeenCalledWith(completedNux)
  expect(mockMetric).toHaveBeenCalledWith('atmosphere:nux:bannerDismissed', {})

  mockUseSaveNux.mockReturnValue({
    mutate: mockSave,
    variables: completedNux,
  } as never)
  rerender(banner())
  expect(screen.toJSON()).toBeNull()
})

it('does not render the banner or its spacing for a saved dismissal', () => {
  mockUseNux.mockReturnValue({nux: completedNux, status: 'ready'})
  render(banner())

  expect(mockUseNux).toHaveBeenCalledWith(Nux.AtmosphereNux)
  expect(screen.toJSON()).toBeNull()
})

it('still opens the about dialog without dismissing the banner', () => {
  render(banner())

  fireEvent.press(screen.getByTestId('atmosphereNuxLearnMore'))

  expect(mockOpenDialog).toHaveBeenCalledTimes(1)
  expect(mockSave).not.toHaveBeenCalled()
})
