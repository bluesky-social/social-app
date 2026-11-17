import {fireEvent, render, screen} from '@testing-library/react-native'

import {AtmosphereNux} from '../AtmosphereNux'

const mockMetric = jest.fn()
const mockSave = jest.fn()
const mockOpenAbout = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
  Trans: () => null,
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('#/state/queries/nuxs', () => ({
  Nux: {AtmosphereNux: 'AtmosphereNux'},
  useNux: () => ({nux: undefined}),
  useSaveNux: () => ({mutate: mockSave, variables: undefined}),
}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('expo-linear-gradient', () => ({LinearGradient: () => null}))
jest.mock('#/components/GradientFill', () => ({GradientFill: () => null}))
jest.mock('#/components/icons/TimesLarge', () => ({
  TimesLarge_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AboutAtmosphereDialog', () => ({
  AboutAtmosphereDialog: () => null,
}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenAbout}),
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({testID, onPress}: {testID: string; onPress: () => void}) => (
      <Pressable testID={testID} accessibilityRole="button" onPress={onPress} />
    ),
    ButtonText: () => null,
    ButtonIcon: () => null,
  }
})
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {gradients: {}},
  useAlf: () => ({themes: {lightPalette: {}}}),
  utils: {alpha: () => '#000'},
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AtmosphereNux', () => {
  it('saves the dismissal and logs it', () => {
    render(<AtmosphereNux />)
    fireEvent.press(screen.getByTestId('atmosphereNuxDismiss'))
    expect(mockSave).toHaveBeenCalledWith({
      id: 'AtmosphereNux',
      completed: true,
      data: undefined,
    })
    expect(mockMetric).toHaveBeenCalledWith(
      'atmosphere:nux:bannerDismissed',
      {},
    )
  })

  it('logs Learn more and opens the dialog', () => {
    render(<AtmosphereNux />)
    fireEvent.press(screen.getByTestId('atmosphereNuxLearnMore'))
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:nux:learnMore', {})
    expect(mockOpenAbout).toHaveBeenCalled()
  })
})
