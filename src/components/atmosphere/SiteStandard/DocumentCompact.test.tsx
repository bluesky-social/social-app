import {StyleSheet} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {DocumentCompact, DocumentCompactCard} from './DocumentCompact'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {},
    {
      get: (_, name) =>
        // Real padding so caller overrides conflict with the default.
        name === 'p_md' ? {padding: 12} : {[`atom_${String(name)}`]: true},
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
  Link: ({
    children,
  }: {
    children: (state: {pressed: boolean}) => React.ReactNode
  }) => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="link">{children({pressed: false})}</View>
  },
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
  AtmosphereCardMenu: ({style}: {style?: object}) => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="menu" style={style} />
  },
}))

const view = {
  uri: 'https://example.com/post',
  title: 'Title',
} as unknown as app.bsky.embed.external.ViewArticle

type Json = {props: {style?: object}; children: Json[]}

/** The link contains the padding; the menu is its direct sibling. */
function parts() {
  const frame = screen.toJSON() as unknown as Json
  const link = frame.children[0]
  const inset = link.children[0]
  const menu = frame.children[1]
  return {frame, link, inset, menu}
}

const flat = (style?: object) =>
  StyleSheet.flatten(style) as Record<string, unknown>

describe('DocumentCompact', () => {
  it('has no default padding or frame, and styles the frame and inset independently', () => {
    render(
      <DocumentCompact
        view={view}
        style={{margin: 1}}
        containerStyle={[{paddingLeft: 4}, {paddingTop: 8}]}
      />,
    )
    const {frame, inset} = parts()

    expect(flat(frame.props.style)).toMatchObject({margin: 1})
    expect(flat(frame.props.style)).not.toHaveProperty('atom_border')
    expect(flat(inset.props.style)).toEqual({paddingLeft: 4, paddingTop: 8})
    expect(screen.getByTestId('documentCompact')).toBeTruthy()
  })

  it.each([DocumentCompact, DocumentCompactCard])(
    'includes padding in the link and offsets its sibling menu (%p)',
    Component => {
      const containerStyle = {
        paddingTop: 8,
        paddingRight: 20,
        paddingBottom: 16,
        paddingLeft: 4,
      }
      render(<Component view={view} containerStyle={containerStyle} />)
      const {frame, link, inset, menu} = parts()

      expect(link.props).toMatchObject({testID: 'link'})
      expect(flat(inset.props.style)).toMatchObject(containerStyle)
      expect(frame.children).toHaveLength(2)
      expect(menu.props).toMatchObject({testID: 'menu'})
      expect(flat(menu.props.style)).toEqual({top: 8, right: 20})
    },
  )

  it('hides the menu in preview', () => {
    render(<DocumentCompact view={view} preview />)

    expect(screen.queryByTestId('menu')).toBeNull()
  })
})

describe('DocumentCompactCard', () => {
  it('is framed and applies its default padding through the inset wrapper', () => {
    render(<DocumentCompactCard view={view} />)
    const {frame, inset} = parts()

    expect(flat(frame.props.style)).toMatchObject({
      atom_border: true,
      atom_rounded_lg: true,
    })
    expect(flat(inset.props.style)).toEqual({padding: 12})
    expect(screen.getByTestId('documentCompactCard')).toBeTruthy()
    expect(flat(screen.getByTestId('menu').props.style)).toEqual({
      top: 12,
      right: 12,
    })
  })

  it('lets caller containerStyle override the default padding', () => {
    render(<DocumentCompactCard view={view} containerStyle={{padding: 2}} />)

    expect(flat(parts().inset.props.style)).toEqual({padding: 2})
    expect(flat(parts().menu.props.style)).toEqual({top: 2, right: 2})
  })
})
