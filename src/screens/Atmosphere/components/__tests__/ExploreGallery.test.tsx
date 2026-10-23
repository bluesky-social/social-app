import {useState} from 'react'
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {ExploreGallery, type ExploreGalleryFocusProps} from '../ExploreGallery'

const mockEnv = {IS_WEB: false}

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockEnv.IS_WEB
  },
  IS_ANDROID: false,
  IS_NATIVE: true,
  IS_WEB_SAFARI: false,
}))
/*
 * Each atom resolves to a marker naming itself, so tests can assert which
 * atoms were applied without loading the whole design system.
 */
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: (_, name) => ({atom: name})}),
  web: () => undefined,
}))
jest.mock('#/state/a11y', () => ({
  useA11y: () => ({screenReaderEnabled: false}),
}))
jest.mock('#/view/shell/BlockDrawerGesture', () => ({
  BlockDrawerGesture: ({children}: {children: React.ReactNode}) => children,
}))

type Item = {id: string; title: string}

const items: Item[] = [
  {id: 'a', title: 'Alpha'},
  {id: 'b', title: 'Beta'},
  {id: 'c', title: 'Gamma'},
]

function flat(style: unknown): ViewStyle {
  return StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {}
}

function slides() {
  return screen.UNSAFE_root.findAll(
    node =>
      typeof node.type === 'string' &&
      node.props['aria-roledescription'] === 'slide',
  )
}

function FocusCard({
  item,
  focusProps,
}: {
  item: Item
  focusProps: ExploreGalleryFocusProps
}) {
  return (
    <Pressable
      testID={`card-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint=""
      ref={focusProps.focusRef}
      tabIndex={focusProps.tabIndex}
      onFocus={focusProps.onFocus}
      style={{width: 100, height: 50}}
    />
  )
}

function renderGallery(data: Item[] = items) {
  return (
    <ExploreGallery
      items={data}
      label="Things"
      testID="thingsGallery"
      renderItem={(item, focusProps) => (
        <FocusCard item={item} focusProps={focusProps} />
      )}
    />
  )
}

beforeEach(() => {
  mockEnv.IS_WEB = false
})

describe('ExploreGallery', () => {
  it('renders one labelled slide per item inside a single root', () => {
    render(renderGallery())

    expect(screen.getAllByTestId('thingsGallery')).toHaveLength(1)
    const rendered = slides()
    expect(rendered).toHaveLength(3)
    expect(rendered.map(slide => slide.props['aria-label'])).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ])
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(3)
  })

  it('keeps the bottom allowance inside each measured slide', () => {
    render(renderGallery())

    for (const slide of slides()) {
      const [wrapper] = slide.children
      if (typeof wrapper === 'string') throw new Error('expected an element')
      expect(wrapper.props.style).toEqual([
        {atom: 'flex_grow'},
        {atom: 'pb_md'},
      ])
    }
    const root = screen.getByTestId('thingsGallery')
    expect(flat(root.props.style).height).toBeUndefined()
  })

  it('opts into stretch without imposing measured heights', () => {
    render(renderGallery())

    const scroll = screen.UNSAFE_getByType(ScrollView)
    expect(flat(scroll.props.contentContainerStyle)).toMatchObject({
      atom: 'align_stretch',
    })
    for (const slide of slides()) {
      expect(flat(slide.props.style)).toMatchObject({atom: 'self_stretch'})
      fireEvent(slide, 'layout', {
        nativeEvent: {layout: {x: 0, y: 0, width: 100, height: 200}},
      })
    }
    expect(
      flat(screen.getByTestId('thingsGallery').props.style).height,
    ).toBeUndefined()
  })

  it('attaches focus to the rendered element rather than the slide', () => {
    mockEnv.IS_WEB = true
    render(renderGallery())

    for (const slide of slides()) {
      expect(slide.props.tabIndex).toBeUndefined()
    }
    expect(screen.getByTestId('card-a').props.tabIndex).toBe(0)
    expect(screen.getByTestId('card-b').props.tabIndex).toBe(-1)
    expect(screen.getByTestId('card-c').props.tabIndex).toBe(-1)

    fireEvent(screen.getByTestId('card-c'), 'focus')
    expect(screen.getByTestId('card-a').props.tabIndex).toBe(-1)
    expect(screen.getByTestId('card-c').props.tabIndex).toBe(0)
  })

  it('renders nothing for an empty list', () => {
    render(renderGallery([]))

    expect(slides()).toHaveLength(0)
  })

  it('keys slides by id, not by array index', () => {
    function Probe({item}: {item: Item}) {
      // Remembers the title it first mounted with, so a stale index key shows
      const [initial] = useState(item.title)
      return (
        <View>
          <Text>{initial}</Text>
        </View>
      )
    }
    const gallery = (data: Item[]) => (
      <ExploreGallery
        items={data}
        label="Things"
        testID="thingsGallery"
        renderItem={item => <Probe item={item} />}
      />
    )
    const labels = () =>
      screen
        .getAllByText(/^(Alpha|Beta|Gamma)$/)
        .map(node => node.props.children)

    const {rerender} = render(gallery(items))
    expect(labels()).toEqual(['Alpha', 'Beta', 'Gamma'])

    rerender(gallery([items[2], items[0]]))
    expect(labels()).toEqual(['Gamma', 'Alpha'])
    expect(slides().map(slide => slide.props['aria-label'])).toEqual([
      'Gamma',
      'Alpha',
    ])
  })
})
