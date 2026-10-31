import {useContext} from 'react'
import {Pressable, Text, View} from 'react-native'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {fireEvent, render, screen} from '@testing-library/react-native'

import * as Dialog from '#/components/Dialog'
import * as Menu from '#/components/Menu'
import {InlineItemPositionContext} from '#/components/Menu/context'
import * as Inline from '#/components/Menu/inline'
import {type InlineItemPosition} from '#/components/Menu/inline/types'
import * as env from '#/env'

jest.mock('#/env', () => ({
  __esModule: true,
  IS_IOS: true,
  IS_ANDROID: false,
  IS_NATIVE: true,
  IS_IPAD: false,
  IS_LIQUID_GLASS: false,
  IS_DEV: false,
}))
jest.mock('#/components/Dialog', () => ({
  Outer: jest.fn(() => null),
  Handle: () => null,
  ScrollableInner: () => null,
  useDialogControl: () => ({
    id: 'default',
    ref: {current: null},
    open: jest.fn(),
    close: jest.fn(),
  }),
}))
jest.mock('#/components/Menu/inline', () => {
  const {View} = require('react-native')
  return {
    InlineRoot: jest.fn(({trigger, children}) => (
      <View>
        {trigger}
        {children}
      </View>
    )),
    InlineSection: jest.fn(({children}) => <View>{children}</View>),
    InlineItem: jest.fn(() => null),
  }
})
jest.mock('#/components/Button', () => ({
  Button: () => null,
  ButtonText: () => null,
}))
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock('#/alf', () => ({atoms: {}, useTheme: () => ({atoms: {}})}))

const i18n = setupI18n()
i18n.loadAndActivate({locale: 'en', messages: {}})

const BellIcon = Object.assign(() => null, {
  glyph: 'Bell_Stroke2_Corner0_Rounded',
})

function renderMenu(menu: React.ReactElement) {
  return render(<I18nProvider i18n={i18n}>{menu}</I18nProvider>)
}

function itemProps() {
  return jest.mocked(Inline.InlineItem).mock.calls.map(([props]) => props)
}

function sectionProps() {
  return jest
    .mocked(Inline.InlineSection)
    .mock.calls.map(([{title, divider}]) => ({title, divider}))
}

function trigger() {
  return (
    <Menu.Trigger label="Options" hint="Opens options">
      {({props}) => (
        <Pressable {...props} testID="trigger">
          <Text>Open</Text>
        </Pressable>
      )}
    </Menu.Trigger>
  )
}

afterEach(() => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
})

describe('inline menu', () => {
  it('hosts the trigger and items in the native menu, without a sheet', () => {
    renderMenu(
      <Menu.Root inline>
        {trigger()}
        <Menu.Outer>
          <Menu.Item label="Copy link" onPress={() => {}}>
            <Menu.ItemText>
              <Trans>Copy link</Trans>
            </Menu.ItemText>
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>,
    )

    expect(Dialog.Outer).not.toHaveBeenCalled()
    expect(Inline.InlineRoot).toHaveBeenCalled()
    expect(screen.getByTestId('trigger')).toBeTruthy()
    expect(itemProps()).toEqual([
      expect.objectContaining({title: 'Copy link', destructive: false}),
    ])
  })

  it('maps item text, icons, radios and states', () => {
    const onPress = jest.fn()
    renderMenu(
      <Menu.Root inline>
        {trigger()}
        <Menu.Outer>
          <Menu.Item label="Notify" onPress={onPress} testID="notifyBtn">
            <Menu.ItemText>
              <Trans>Notify me</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={BellIcon} position="right" />
          </Menu.Item>
          <Menu.Item label="Linear" onPress={() => {}}>
            <Menu.ItemText>Linear</Menu.ItemText>
            <Menu.ItemRadio selected={false} />
          </Menu.Item>
          <Menu.Item label="Delete" onPress={() => {}} destructive disabled>
            <Menu.ItemText>
              <View />
            </Menu.ItemText>
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>,
    )

    expect(itemProps()).toEqual([
      {
        title: 'Notify me',
        glyph: 'Bell_Stroke2_Corner0_Rounded',
        selected: undefined,
        destructive: false,
        disabled: false,
        testID: 'notifyBtn',
        onPress: expect.any(Function),
      },
      expect.objectContaining({title: 'Linear', selected: false}),
      // Text that can't be read falls back to the accessibility label.
      expect.objectContaining({
        title: 'Delete',
        destructive: true,
        disabled: true,
      }),
    ])

    itemProps()[0].onPress()
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith()
  })

  it('makes sections of groups, titled by the label above them', () => {
    renderMenu(
      <Menu.Root inline>
        {trigger()}
        <Menu.Outer>
          <Menu.Item label="Loose" onPress={() => {}}>
            <Menu.ItemText>Loose</Menu.ItemText>
          </Menu.Item>
          <Menu.LabelText>
            <Trans>Show replies as</Trans>
          </Menu.LabelText>
          <Menu.Group>
            <Menu.Item label="Linear" onPress={() => {}}>
              <Menu.ItemText>Linear</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            <Menu.Item label="Top" onPress={() => {}}>
              <Menu.ItemText>Top</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
          <Menu.Item label="Before divider" onPress={() => {}}>
            <Menu.ItemText>Before divider</Menu.ItemText>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item label="After divider" onPress={() => {}}>
            <Menu.ItemText>After divider</Menu.ItemText>
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>,
    )

    expect(sectionProps()).toEqual([
      {title: undefined, divider: false},
      {title: 'Show replies as', divider: true},
      {title: undefined, divider: true},
      {title: undefined, divider: true},
      {title: undefined, divider: true},
    ])
    expect(itemProps().map(item => item.title)).toEqual([
      'Loose',
      'Linear',
      'Top',
      'Before divider',
      'After divider',
    ])
  })

  it('numbers the items across all sections', () => {
    const positions: Record<string, InlineItemPosition> = {}
    jest.mocked(Inline.InlineItem).mockImplementation(function Item({title}) {
      positions[title] = useContext(InlineItemPositionContext)
      return <View />
    })

    renderMenu(
      <Menu.Root inline>
        {trigger()}
        <Menu.Outer>
          <Menu.Item label="A" onPress={() => {}}>
            <Menu.ItemText>A</Menu.ItemText>
          </Menu.Item>
          {false && (
            <Menu.Item label="Hidden" onPress={() => {}}>
              <Menu.ItemText>Hidden</Menu.ItemText>
            </Menu.Item>
          )}
          <Menu.LabelText>Label</Menu.LabelText>
          <Menu.Group>
            <Menu.Item label="B" onPress={() => {}}>
              <Menu.ItemText>B</Menu.ItemText>
            </Menu.Item>
            {null}
            <Menu.Item label="C" onPress={() => {}}>
              <Menu.ItemText>C</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Item label="D" onPress={() => {}}>
            <Menu.ItemText>D</Menu.ItemText>
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>,
    )
    jest.mocked(Inline.InlineItem).mockImplementation(() => <View />)

    expect(positions).toEqual({
      A: {index: 0, count: 4},
      B: {index: 1, count: 4},
      C: {index: 2, count: 4},
      D: {index: 3, count: 4},
    })
  })

  it('opens from the trigger on Android only', () => {
    const control = {
      id: 'control',
      ref: {current: null},
      open: jest.fn(),
      close: jest.fn(),
    }
    const menu = (
      <Menu.Root inline control={control}>
        {trigger()}
        <Menu.Outer />
      </Menu.Root>
    )

    renderMenu(menu)
    fireEvent.press(screen.getByTestId('trigger'))
    expect(control.open).not.toHaveBeenCalled()

    jest.replaceProperty(env, 'IS_IOS', false)
    jest.replaceProperty(env, 'IS_ANDROID', true)
    screen.rerender(<I18nProvider i18n={i18n}>{menu}</I18nProvider>)
    fireEvent.press(screen.getByTestId('trigger'))
    expect(control.open).toHaveBeenCalledTimes(1)
  })

  it('falls back to the sheet when Outer is not a direct child', () => {
    function Items() {
      return <Menu.Outer />
    }
    renderMenu(
      <Menu.Root inline>
        {trigger()}
        <Items />
      </Menu.Root>,
    )

    expect(Inline.InlineRoot).not.toHaveBeenCalled()
    expect(Dialog.Outer).toHaveBeenCalled()
  })
})
