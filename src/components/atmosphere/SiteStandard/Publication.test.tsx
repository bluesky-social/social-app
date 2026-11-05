import {StyleSheet} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {Publication, PublicationCard} from './Publication'

const mockMenu = jest.fn<void, [{author?: object; offsetY?: number}]>()

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
jest.mock('#/components/atmosphere/SiteStandard/PublicationIcon', () => ({
  PublicationIcon: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: (props: {author?: object; offsetY?: number}) => {
    mockMenu(props)
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return (
      <View
        testID="menu"
        style={{
          top: props.offsetY,
          right: (props as {offsetX?: number}).offsetX,
        }}
      />
    )
  },
}))

const owner: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:ewvi7nxzyoun6zhxrhs64oiz',
  handle: 'owner.test',
}
const view = {
  uri: 'https://example.com',
  title: 'Title',
  description: 'Description',
} satisfies app.bsky.embed.external.ViewArticlePublication

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

beforeEach(() => mockMenu.mockClear())

describe('Publication', () => {
  it('has no default padding or frame, and styles the frame and inset independently', () => {
    render(
      <Publication
        view={view}
        style={{margin: 1}}
        containerStyle={[{paddingLeft: 4}, {paddingTop: 8}]}
      />,
    )
    const {frame, inset} = parts()

    expect(screen.getByTestId('publication')).toBeTruthy()
    expect(flat(frame.props.style)).toMatchObject({margin: 1})
    for (const atom of ['border', 'rounded_lg', 'p_md']) {
      expect(flat(frame.props.style)).not.toHaveProperty(`atom_${atom}`)
    }
    expect(flat(inset.props.style)).toEqual({paddingLeft: 4, paddingTop: 8})
  })

  it.each([Publication, PublicationCard])(
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
      expect(flat(menu.props.style)).toEqual({top: 8, right: 20})
    },
  )

  it('hides the menu in preview', () => {
    render(<Publication view={view} preview />)

    expect(screen.queryByTestId('menu')).toBeNull()
  })

  it('gives the menu the profile whose repo holds the publication record', () => {
    const other: app.bsky.actor.defs.ProfileViewBasic = {
      did: 'did:plc:other',
      handle: 'other.test',
    }
    render(
      <Publication
        view={{
          ...view,
          associatedProfiles: [other, owner],
          associatedRefs: [
            {
              uri: `at://${owner.did}/site.standard.publication/abc`,
              cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
            },
          ],
        }}
      />,
    )

    expect(mockMenu.mock.calls[0][0].author).toBe(owner)
  })
})

describe('PublicationCard', () => {
  it('is framed and applies its default padding through the inset wrapper', () => {
    render(<PublicationCard view={view} style={{margin: 1}} />)
    const {frame, inset, menu} = parts()

    expect(screen.getByTestId('publicationCard')).toBeTruthy()
    expect(flat(frame.props.style)).toMatchObject({
      margin: 1,
      atom_border: true,
      atom_rounded_lg: true,
    })
    expect(flat(frame.props.style)).not.toHaveProperty('padding')
    expect(flat(inset.props.style)).toEqual({padding: 12})
    expect(flat(menu.props.style)).toEqual({top: 12, right: 12})
  })

  it('lets caller containerStyle override the default padding', () => {
    render(<PublicationCard view={view} containerStyle={{padding: 2}} />)

    expect(flat(parts().inset.props.style)).toEqual({padding: 2})
    expect(flat(parts().menu.props.style)).toEqual({top: 2, right: 2})
  })
})
