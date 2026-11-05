import {StyleSheet} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {Document, DocumentCard} from './Document'

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
jest.mock('#/components/Typography', () => ({
  Text: () => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="title" />
  },
}))
jest.mock('#/components/Divider', () => ({Divider: () => null}))
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock(
  '#/components/atmosphere/SiteStandard/DocumentPublicationRow',
  () => ({
    DocumentPublicationRow: ({style}: {style?: object}) => {
      const {View} =
        jest.requireActual<typeof import('react-native')>('react-native')
      return <View testID="publisherRow" style={style} />
    },
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
  description: 'Description',
} satisfies app.bsky.embed.external.ViewArticle

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
  (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>

describe.each([
  ['Document', Document, 'document'],
  ['DocumentCard', DocumentCard, 'documentCard'],
])('%s', (_name, Component, testID) => {
  it('includes asymmetric padding in the link while keeping the menu independently inset', () => {
    const containerStyle = {
      paddingTop: 8,
      paddingRight: 20,
      paddingBottom: 16,
      paddingLeft: 4,
    }
    render(<Component view={view} containerStyle={containerStyle} />)
    const {frame, link, inset, menu} = parts()

    expect(screen.getByTestId(testID)).toBeTruthy()
    expect(link.props).toMatchObject({testID: 'link'})
    expect(flat(inset.props.style)).toMatchObject(containerStyle)
    expect(frame.children).toHaveLength(2)
    expect(menu.props).toMatchObject({testID: 'menu'})
    expect(flat(menu.props.style)).toEqual({top: 8, right: 20})
  })

  it('hides the menu in preview', () => {
    render(<Component view={view} preview />)

    expect(screen.queryByTestId('menu')).toBeNull()
  })
})

describe('Document', () => {
  it('has no default padding or frame, and styles the frame and inset independently', () => {
    render(
      <Document
        view={view}
        style={{margin: 1}}
        containerStyle={[{paddingLeft: 4}, {paddingTop: 8}]}
      />,
    )
    const {frame, inset} = parts()

    expect(flat(frame.props.style)).toMatchObject({margin: 1})
    expect(flat(frame.props.style)).not.toHaveProperty('atom_border')
    expect(flat(frame.props.style)).not.toHaveProperty('atom_rounded_lg')
    expect(flat(inset.props.style)).toEqual({paddingLeft: 4, paddingTop: 8})
    // No hidden per-section edge padding behind the inset.
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/atom_p[xy]_(md|sm)/)
  })
})

describe('DocumentCard', () => {
  it('is framed and applies its default padding through the inset wrapper', () => {
    render(<DocumentCard view={view} style={{margin: 1}} />)
    const {frame, inset} = parts()

    expect(flat(frame.props.style)).toMatchObject({
      margin: 1,
      atom_border: true,
      atom_rounded_lg: true,
    })
    expect(flat(inset.props.style)).toEqual({padding: 12})
    expect(flat(parts().menu.props.style)).toEqual({top: 12, right: 12})
  })

  it('lets caller containerStyle override the default padding', () => {
    render(<DocumentCard view={view} containerStyle={{padding: 2}} />)

    expect(flat(parts().inset.props.style)).toEqual({padding: 2})
    expect(flat(parts().menu.props.style)).toEqual({top: 2, right: 2})
  })
})

describe('menu clearance without an image', () => {
  const publisher = {
    uri: 'https://example.com',
    title: 'Publisher',
    description: '',
  } satisfies app.bsky.embed.external.ViewArticlePublication
  const image = 'https://example.com/i.png'

  const titleWrapperStyle = () => {
    const parentOfTitle = (node: Json, parent?: Json): Json | undefined =>
      (node.props as {testID?: string}).testID === 'title'
        ? parent
        : (node.children ?? []).map(c => parentOfTitle(c, node)).find(Boolean)
    return flat(parentOfTitle(screen.toJSON() as unknown as Json)?.props.style)
  }
  const publisherRowStyle = () =>
    flat(screen.getByTestId('publisherRow').props.style)

  it('wraps the title when there is no publisher, even with an empty title', () => {
    render(<Document view={{...view, title: ''}} />)

    expect(titleWrapperStyle()).toMatchObject({
      atom_pr_5xl: true,
      minHeight: 28,
    })
  })

  it('wraps the publisher row instead when there is one', () => {
    render(<Document view={{...view, publisher}} />)

    expect(publisherRowStyle()).toMatchObject({
      atom_pr_5xl: true,
      minHeight: 28,
    })
    expect(titleWrapperStyle()).not.toHaveProperty('atom_pr_5xl')
  })

  it('adds the image inset to resolved container padding', () => {
    render(
      <DocumentCard
        view={{...view, image}}
        containerStyle={{paddingTop: 0, paddingRight: 4}}
      />,
    )

    expect(flat(parts().menu.props.style)).toEqual({top: 8, right: 12})
  })

  it('reserves nothing with an image or in preview', () => {
    render(<Document view={{...view, image}} />)
    expect(titleWrapperStyle()).not.toHaveProperty('atom_pr_5xl')
    // The image keeps the menu's extra inset.
    expect(flat(screen.getByTestId('menu').props.style)).toEqual({
      top: 8,
      right: 8,
    })
    screen.unmount()

    render(<Document view={view} preview />)
    expect(titleWrapperStyle()).not.toHaveProperty('atom_pr_5xl')
  })
})
