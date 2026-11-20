import {render} from '@testing-library/react-native'

import {shareUrl} from '#/lib/sharing'
import {type app} from '#/lexicons'
import {Document} from './Document'
import {DocumentCompact, DocumentCompactCard} from './DocumentCompact'

let mockIsNative = false
let mockOnLongPress: (() => void) | undefined

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
jest.mock('#/env', () => ({
  get IS_NATIVE() {
    return mockIsNative
  },
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/lib/haptics', () => ({
  useHaptics: () => ({tap: jest.fn(), longPress: jest.fn()}),
}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('expo-image', () => ({Image: () => null}))
jest.mock('#/components/Link', () => ({
  Link: ({
    children,
    onLongPress,
  }: {
    children: React.ReactNode | ((state: {pressed: boolean}) => React.ReactNode)
    onLongPress?: () => void
  }) => {
    mockOnLongPress = onLongPress
    return typeof children === 'function'
      ? children({pressed: false})
      : children
  },
}))
jest.mock('#/components/Divider', () => ({Divider: () => null}))
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock(
  '#/components/atmosphere/SiteStandard/DocumentPublicationRow',
  () => ({
    DocumentPublicationRow: () => null,
  }),
)
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

beforeEach(() => {
  jest.clearAllMocks()
  mockIsNative = false
  mockOnLongPress = undefined
})

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

describe.each([Document, DocumentCompact, DocumentCompactCard])(
  'native sharing (%p)',
  Component => {
    it.each([true, false])(
      'supports an optional onShareCallback: %s',
      withCallback => {
        mockIsNative = true
        const onShare = jest.fn()
        const onPress = jest.fn()
        render(
          <Component
            view={view}
            onShareCallback={withCallback ? onShare : undefined}
            onPressCallback={onPress}
          />,
        )

        expect(mockOnLongPress).toEqual(expect.any(Function))
        mockOnLongPress?.()
        expect(shareUrl).toHaveBeenCalledWith(view.uri)
        expect(onShare).toHaveBeenCalledTimes(withCallback ? 1 : 0)
        expect(onPress).not.toHaveBeenCalled()
      },
    )
  },
)
