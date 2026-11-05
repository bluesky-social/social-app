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
  Link: () => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="link" />
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

/** Outer frame > inset wrapper > unpadded anchor > [link, menu]. */
function parts() {
  const frame = screen.toJSON() as unknown as Json
  const inset = frame.children[0]
  const anchor = inset.children[0]
  return {frame, inset, anchor}
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

  it('keeps the menu a sibling of the link inside the padded wrapper', () => {
    render(<DocumentCompact view={view} containerStyle={{padding: 10}} />)
    const {inset, anchor} = parts()

    expect(flat(inset.props.style)).toEqual({padding: 10})
    expect(flat(anchor.props.style)).toEqual({atom_relative: true})
    expect(anchor.children.map(c => c.props)).toEqual([
      expect.objectContaining({testID: 'link'}),
      expect.objectContaining({testID: 'menu'}),
    ])
    expect(flat(screen.getByTestId('menu').props.style)).toEqual({
      top: 0,
      right: 0,
    })
  })

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
      top: 0,
      right: 0,
    })
  })

  it('lets caller containerStyle override the default padding', () => {
    render(<DocumentCompactCard view={view} containerStyle={{padding: 2}} />)

    expect(flat(parts().inset.props.style)).toEqual({padding: 2})
  })
})
