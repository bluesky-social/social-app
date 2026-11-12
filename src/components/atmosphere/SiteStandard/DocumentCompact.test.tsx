import {render} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {DocumentCompact, DocumentCompactCard} from './DocumentCompact'

const mockMenu = jest.fn<null, [{offsetY?: number; offsetX?: number}]>(
  () => null,
)

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {},
    {
      // Real card padding so caller overrides conflict with the default.
      get: (_, name) => (name === 'p_md' ? {padding: 12} : {}),
    },
  ),
  extractPadding:
    jest.requireActual<typeof import('#/alf/util/flatten')>(
      '#/alf/util/flatten',
    ).extractPadding,
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
  web: () => undefined,
}))
jest.mock('#/env', () => ({IS_NATIVE: false}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/lib/haptics', () => ({
  useHaptics: () => ({tap: jest.fn(), longPress: jest.fn()}),
}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/Link', () => ({
  Link: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock(
  '#/components/atmosphere/SiteStandard/DocumentPublicationRow',
  () => ({
    DocumentPublicationRow: () => null,
  }),
)
jest.mock('#/components/atmosphere/SiteStandard/DocumentStats', () => ({
  DocumentStats: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: (props: {offsetY?: number; offsetX?: number}) =>
    mockMenu(props),
}))

const view = {
  uri: 'https://example.com/post',
  title: 'Title',
} as unknown as app.bsky.embed.external.ViewArticle

const menuOffsets = () => {
  const {offsetY, offsetX} = mockMenu.mock.calls[0][0]
  return {offsetY, offsetX}
}

beforeEach(() => mockMenu.mockClear())

it.each([DocumentCompact, DocumentCompactCard])(
  'aligns the menu with the container padding (%p)',
  Component => {
    render(
      <Component
        view={view}
        containerStyle={{paddingTop: 8, paddingRight: 20, paddingLeft: 4}}
      />,
    )

    expect(menuOffsets()).toEqual({offsetY: 8, offsetX: 20})
  },
)

it('aligns the card menu with its default padding', () => {
  render(<DocumentCompactCard view={view} />)

  expect(menuOffsets()).toEqual({offsetY: 12, offsetX: 12})
})

it('aligns the card menu with a caller padding override', () => {
  render(<DocumentCompactCard view={view} containerStyle={{padding: 2}} />)

  expect(menuOffsets()).toEqual({offsetY: 2, offsetX: 2})
})

it('hides the menu in preview', () => {
  render(<DocumentCompact view={view} preview />)

  expect(mockMenu).not.toHaveBeenCalled()
})
