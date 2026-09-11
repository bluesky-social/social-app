import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {createDocumentExternalView} from '#/screens/Atmosphere/externalViews'
import {
  createActor,
  createDocumentRecords,
  documentUri,
} from '#/screens/Atmosphere/testFixtures'
import {type ActivityActor} from '#/screens/Atmosphere/types'
import {type app} from '#/lexicons'
import {DocumentMenu} from './DocumentMenu'

const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()
const mockReport = jest.fn()
type Children = {children?: React.ReactNode}

jest.mock('#/lib/hooks/useOpenLink', () => ({useOpenLink: () => mockOpenLink}))
jest.mock('#/Navigation', () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
}))
jest.mock('#/components/moderation/ReportDialog', () => ({
  useGlobalReportDialogControl: () => ({open: mockReport}),
}))
jest.mock('#/view/com/util/EventStopper', () => ({
  EventStopper: ({children}: Children) => children,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      testID,
    }: Children & {label: string; testID?: string}) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Menu', () => {
  const {View, Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Root: ({children}: Children) => <View>{children}</View>,
    Outer: ({children}: Children) => <View>{children}</View>,
    Group: ({children}: Children) => <View>{children}</View>,
    Divider: () => <View testID="divider" />,
    Trigger: ({
      children,
      label,
    }: {
      children: (args: {props: {accessibilityLabel: string}}) => React.ReactNode
      label: string
    }) => children({props: {accessibilityLabel: label}}),
    Item: ({
      children,
      label,
      onPress,
      disabled,
    }: Children & {label: string; onPress: () => void; disabled?: boolean}) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        accessibilityRole="menuitem"
        disabled={disabled}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ItemText: ({children}: Children) => <Text>{children}</Text>,
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})
beforeEach(() => {
  jest.clearAllMocks()
})

function view() {
  const result = createDocumentExternalView({
    uri: documentUri,
    associatedRecords: createDocumentRecords(),
    actors: {},
  })
  if (!result) throw new Error('Expected article view')
  return result
}

function renderMenu(article = view(), author?: ActivityActor) {
  return render(
    <I18nProvider i18n={i18n}>
      <DocumentMenu view={article} author={author} />
    </I18nProvider>,
  )
}

describe('Atmosphere document menu', () => {
  it('opens publication and author targets independently and reports the author account', () => {
    const author = createActor()
    const screen = renderMenu(view(), author)
    expect(screen.getByTestId('atmosphereDocumentMenu')).toBeTruthy()
    expect(screen.getByTestId('divider')).toBeTruthy()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View publication'}))
    expect(mockOpenLink).toHaveBeenCalledWith('https://publication.example/')
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockReport).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View author'}))
    expect(mockNavigate).toHaveBeenCalledWith('Profile', {name: author.handle})
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report this'}))
    expect(mockReport).toHaveBeenCalledWith({
      subject: {...author, $type: 'app.bsky.actor.defs#profileViewBasic'},
    })
  })

  it('disables author/report actions without an author, retaining a real publication link', () => {
    const screen = renderMenu()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View author'}))
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report this'}))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockReport).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View publication'}))
    expect(mockOpenLink).toHaveBeenCalledWith('https://publication.example/')
  })

  it('does not infer a publication URL from an article URL', () => {
    const article: app.bsky.embed.external.ViewExternal = {
      ...view(),
      source: undefined,
    }
    const screen = renderMenu(article, createActor())
    fireEvent.press(screen.getByRole('menuitem', {name: 'View publication'}))
    expect(mockOpenLink).not.toHaveBeenCalled()
    expect(screen.getByTestId('atmosphereDocumentMenu')).toBeTruthy()
  })

  it('keeps author actions available without an external view', () => {
    const author = createActor()
    const screen = render(
      <I18nProvider i18n={i18n}>
        <DocumentMenu author={author} />
      </I18nProvider>,
    )
    fireEvent.press(screen.getByRole('menuitem', {name: 'View publication'}))
    expect(mockOpenLink).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('menuitem', {name: 'View author'}))
    expect(mockNavigate).toHaveBeenCalledWith('Profile', {name: author.handle})
    fireEvent.press(screen.getByRole('menuitem', {name: 'Report this'}))
    expect(mockReport).toHaveBeenCalledWith({
      subject: {...author, $type: 'app.bsky.actor.defs#profileViewBasic'},
    })
  })

  it('omits a menu with no functional targets', () => {
    const screen = renderMenu({...view(), source: undefined})
    expect(screen.queryByTestId('atmosphereDocumentMenu')).toBeNull()
  })
})
