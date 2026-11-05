import {type Ref} from 'react'
import {StyleSheet, type View} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {Publication, PublicationCard} from './Publication'

type LinkMockProps = {
  ref?: Ref<View>
  tabIndex?: 0 | -1
  onFocus?: () => void
  style?: object
}
const mockPrimaryLink = jest.fn<void, [LinkMockProps]>()
const mockSubscribe = jest.fn<void, [{linkProps?: object}]>()

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
  useBreakpoints: () => ({gtPhone: true}),
  web: () => undefined,
}))
jest.mock('#/components/Link', () => ({
  Link: (props: LinkMockProps) => {
    mockPrimaryLink(props)
    return null
  },
}))
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock('#/components/atmosphere/SiteStandard/PublicationIcon', () => ({
  PublicationIcon: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/SubscribeButton', () => ({
  SubscribeButton: (props: {linkProps?: object}) => {
    mockSubscribe(props)
    return null
  },
}))

const view = {
  uri: 'https://example.com',
  title: 'Title',
  description: 'Description',
} satisfies app.bsky.embed.external.ViewArticlePublication

type Json = {props: {style?: object}; children: Json[]}

/** Outer frame > inset wrapper > unpadded anchor > content. */
function parts() {
  const frame = screen.toJSON() as unknown as Json
  const inset = frame.children[0]
  const anchor = inset.children[0]
  return {frame, inset, anchor}
}

const flat = (style?: object) =>
  (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>

beforeEach(() => {
  mockPrimaryLink.mockClear()
  mockSubscribe.mockClear()
})

describe('Publication', () => {
  it('has no default padding, frame, or fill, and styles the frame and inset independently', () => {
    render(
      <Publication
        view={view}
        style={{margin: 1}}
        containerStyle={[{paddingLeft: 4}, {paddingTop: 8}]}
      />,
    )
    const {frame, inset, anchor} = parts()

    expect(screen.getByTestId('publication')).toBeTruthy()
    expect(flat(frame.props.style)).toMatchObject({margin: 1})
    for (const atom of ['border', 'rounded_lg', 'overflow_hidden', 'p_md']) {
      expect(flat(frame.props.style)).not.toHaveProperty(`atom_${atom}`)
    }
    expect(flat(inset.props.style)).toEqual({paddingLeft: 4, paddingTop: 8})
    expect(flat(anchor.props.style)).toEqual({atom_relative: true})
  })

  it('keeps primary and subscribe focus props independent', () => {
    const ref = {current: null}
    const onFocus = jest.fn()
    render(<Publication view={view} linkProps={{ref, tabIndex: -1, onFocus}} />)

    expect(mockPrimaryLink.mock.calls[0][0]).toMatchObject({
      ref,
      tabIndex: -1,
    })
    expect(mockSubscribe.mock.calls[0][0].linkProps).toEqual({
      tabIndex: -1,
      onFocus,
    })
  })
})

describe('PublicationCard', () => {
  it('is framed and applies its default padding through the inset wrapper', () => {
    render(<PublicationCard view={view} style={{margin: 1}} />)
    const {frame, inset} = parts()

    expect(screen.getByTestId('publicationCard')).toBeTruthy()
    expect(flat(frame.props.style)).toMatchObject({
      margin: 1,
      atom_border: true,
      atom_rounded_lg: true,
    })
    expect(flat(frame.props.style)).not.toHaveProperty('padding')
    expect(flat(inset.props.style)).toEqual({padding: 12})
  })

  it('lets caller containerStyle override the default padding', () => {
    render(<PublicationCard view={view} containerStyle={{padding: 2}} />)

    expect(flat(parts().inset.props.style)).toEqual({padding: 2})
  })
})
