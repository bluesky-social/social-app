import {View} from 'react-native'
import {i18n} from '@lingui/core'
import {Trans} from '@lingui/react/macro'

import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {setHeaderRole} from '#/components/Layout/Header/native/roles'
import {
  createPressEvent,
  toNativeHeader,
} from '#/components/Layout/Header/native/toNativeHeader'

/*
 * The real components pull in Reanimated. The converter only looks at element
 * types and props, so stand-ins with the same identity and roles will do.
 */
jest.mock('#/components/Button', () => ({
  Button: () => null,
  ButtonIcon: () => null,
  ButtonText: () => null,
}))

const Header = {
  BackButton: (_: {onPress?: () => void}) => null,
  MenuButton: () => null,
  Content: (_: {children?: React.ReactNode}) => null,
  TitleText: (_: {children?: React.ReactNode}) => null,
  SubtitleText: (_: {children?: React.ReactNode}) => null,
  Slot: (_: {children?: React.ReactNode}) => null,
}
setHeaderRole(Header.BackButton, 'back')
setHeaderRole(Header.MenuButton, 'menu')
setHeaderRole(Header.Content, 'content')
setHeaderRole(Header.TitleText, 'title')
setHeaderRole(Header.SubtitleText, 'subtitle')
setHeaderRole(Header.Slot, 'slot')

const Plus = () => null

i18n.loadAndActivate({locale: 'en', messages: {}})

const sfPlus = {type: 'sfSymbol', name: 'plus'} as const
const resolveIcon = (icon: unknown) => (icon === Plus ? sfPlus : undefined)

describe('toNativeHeader', () => {
  it('reads a back button and a translated title', () => {
    const spec = toNativeHeader(
      <>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>
            <Trans>Accessibility</Trans>
          </Header.TitleText>
        </Header.Content>
        <Header.Slot />
      </>,
      i18n,
    )
    expect(spec).toEqual({
      back: {onPress: undefined},
      menu: false,
      title: 'Accessibility',
      leftItems: [],
      rightItems: [],
    })
  })

  it('reads a menu button', () => {
    const spec = toNativeHeader(
      <>
        <Header.MenuButton />
        <Header.Content>
          <Header.TitleText>Feeds</Header.TitleText>
        </Header.Content>
      </>,
      i18n,
    )
    expect(spec.menu).toBe(true)
    expect(spec.back).toBeUndefined()
    expect(spec.title).toBe('Feeds')
  })

  it('keeps a back button onPress', () => {
    const onPress = jest.fn()
    const spec = toNativeHeader(<Header.BackButton onPress={onPress} />, i18n)
    expect(spec.back?.onPress).toBe(onPress)
  })

  it('falls back to a custom title for subtitles and rich titles', () => {
    const withSubtitle = (
      <>
        <Header.TitleText>Account</Header.TitleText>
        <Header.SubtitleText>@alice.test</Header.SubtitleText>
      </>
    )
    expect(
      toNativeHeader(<Header.Content>{withSubtitle}</Header.Content>, i18n),
    ).toMatchObject({title: '', customTitle: withSubtitle})

    const rich = (
      <Header.TitleText>
        <View />
      </Header.TitleText>
    )
    expect(
      toNativeHeader(<Header.Content>{rich}</Header.Content>, i18n),
    ).toMatchObject({title: '', customTitle: rich})
  })

  it('converts icon and text buttons to native bar buttons', () => {
    const onAdd = jest.fn()
    const onSave = jest.fn()
    const onNew = jest.fn()
    const spec = toNativeHeader(
      <>
        <Header.Content>
          <Header.TitleText>Lists</Header.TitleText>
        </Header.Content>
        <Header.Slot>
          <Button label="Add" onPress={onAdd}>
            <ButtonIcon icon={Plus} />
          </Button>
        </Header.Slot>
        <Button label="Save changes" color="primary" disabled onPress={onSave}>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
        </Button>
        {/* Text wins, even over an icon with no native equivalent */}
        <Button label="New list" onPress={onNew}>
          <ButtonIcon icon={() => null} />
          <ButtonText>New</ButtonText>
        </Button>
      </>,
      i18n,
      resolveIcon,
    )
    expect(spec.leftItems).toEqual([])
    expect(spec.rightItems).toEqual([
      {
        type: 'button',
        label: 'Add',
        accessibilityLabel: 'Add',
        icon: sfPlus,
        disabled: undefined,
        variant: 'plain',
        onPress: expect.any(Function),
      },
      {
        type: 'button',
        label: 'Save',
        accessibilityLabel: 'Save changes',
        icon: undefined,
        disabled: true,
        variant: 'prominent',
        onPress: expect.any(Function),
      },
      {
        type: 'button',
        label: 'New',
        accessibilityLabel: 'New list',
        icon: undefined,
        disabled: undefined,
        variant: 'plain',
        onPress: expect.any(Function),
      },
    ])
    for (const item of spec.rightItems) {
      if (item.type === 'button') item.onPress()
    }
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('falls back to custom items for anything else', () => {
    const loader = <View testID="loader" />
    const unknownIcon = (
      <Button label="Edit" onPress={() => {}}>
        <ButtonIcon icon={() => null} />
      </Button>
    )
    const renderProp = (
      <Button label="Edit" onPress={() => {}}>
        {() => <View />}
      </Button>
    )
    const spec = toNativeHeader(
      <>
        {loader}
        <Header.Content>
          <Header.TitleText>Interests</Header.TitleText>
        </Header.Content>
        <Header.Slot>
          {unknownIcon}
          {false}
          {renderProp}
        </Header.Slot>
      </>,
      i18n,
      resolveIcon,
    )
    const custom = (element: React.ReactElement) => ({
      type: 'custom',
      element,
      hidesSharedBackground: true,
    })
    expect(spec.leftItems).toEqual([custom(loader)])
    expect(spec.rightItems).toEqual([custom(unknownIcon), custom(renderProp)])
  })
})

describe('createPressEvent', () => {
  it('tracks preventDefault', () => {
    const event = createPressEvent()
    expect(event.defaultPrevented).toBe(false)
    event.preventDefault()
    expect(event.defaultPrevented).toBe(true)
  })
})
