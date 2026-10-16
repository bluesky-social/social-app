import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSetThemePrefs} from '#/state/shell'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, ThemeProvider} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsDiagonalIcon} from '#/components/icons/ArrowsDiagonal'
import {ArrowTopCircle_Stroke2_Corner0_Rounded as ArrowTopCircleIcon} from '#/components/icons/ArrowTopCircle'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {BulletList_Stroke2_Corner0_Rounded as BulletListIcon} from '#/components/icons/BulletList'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {CirclePlus_Stroke2_Corner0_Rounded as CirclePlusIcon} from '#/components/icons/CirclePlus'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPaletteIcon} from '#/components/icons/ColorPalette'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import {Haptic_Stroke2_Corner2_Rounded as HapticIcon} from '#/components/icons/Haptic'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Menu_Stroke2_Corner0_Rounded as MenuIcon} from '#/components/icons/Menu'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {PinLocation_Stroke2_Corner0_Rounded as PinLocationIcon} from '#/components/icons/PinLocation'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsGearIcon} from '#/components/icons/SettingsGear2'
import {Shapes_Stroke2_Corner0_Rounded as ShapesIcon} from '#/components/icons/Shapes'
import {SquareBehindSquare4_Stroke2_Corner0_Rounded as SquareBehindSquareIcon} from '#/components/icons/SquareBehindSquare4'
import {TextSize_Stroke2_Corner0_Rounded as TextSizeIcon} from '#/components/icons/TextSize'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import {Wrench_Stroke2_Corner2_Rounded as WrenchIcon} from '#/components/icons/Wrench'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {
  useDeviceGeolocationApi,
  useRequestDeviceGeolocation,
} from '#/geolocation'
import {Admonitions} from './Admonitions'
import {Breakpoints} from './Breakpoints'
import {Buttons} from './Buttons'
import {Dialogs} from './Dialogs'
import {Forms} from './Forms'
import {Haptics} from './Haptics'
import {Icons} from './Icons'
import {Links} from './Links'
import {ListContained} from './ListContained'
import {Menus} from './Menus'
import {NewPostsPill} from './NewPostsPill'
import {Notifications} from './Notifications'
import {Settings} from './Settings'
import {Shadows} from './Shadows'
import {Spacing} from './Spacing'
import {Theming} from './Theming'
import {Toasts} from './Toasts'
import {Tooltips} from './Tooltips'
import {Typography} from './Typography'

/**
 * Every storybook section, keyed by the title shown in the list and header.
 */
const SECTIONS = {
  Theming: {icon: ColorPaletteIcon, Component: ThemingSection},
  Haptics: {icon: HapticIcon, Component: Haptics},
  Toasts: {icon: BubbleInfoIcon, Component: Toasts},
  Buttons: {icon: CirclePlusIcon, Component: Buttons},
  'New posts pill': {icon: ArrowTopCircleIcon, Component: NewPostsPill},
  Notifications: {icon: BellIcon, Component: Notifications},
  Forms: {icon: PencilIcon, Component: Forms},
  Typography: {icon: TextSizeIcon, Component: Typography},
  Spacing: {icon: ArrowsDiagonalIcon, Component: Spacing},
  Shadows: {icon: SquareBehindSquareIcon, Component: Shadows},
  Icons: {icon: ShapesIcon, Component: Icons},
  Links: {icon: ChainLinkIcon, Component: Links},
  Tooltips: {icon: CircleInfoIcon, Component: Tooltips},
  Dialogs: {icon: WindowIcon, Component: Dialogs},
  Menus: {icon: MenuIcon, Component: Menus},
  Breakpoints: {icon: MacintoshIcon, Component: Breakpoints},
  Admonitions: {icon: WarningIcon, Component: Admonitions},
  Settings: {icon: SettingsGearIcon, Component: Settings},
  'Contained list': {icon: BulletListIcon, Component: ListContained},
} satisfies Record<
  string,
  {
    icon: React.ComponentProps<typeof SettingsList.ItemIcon>['icon']
    Component: React.ComponentType
  }
>

export type Section = keyof typeof SECTIONS

export default function Storybook({
  section,
  onSelectSection,
}: {
  section: Section | null
  onSelectSection: (section: Section) => void
}) {
  if (!section) {
    return <Home onSelectSection={onSelectSection} />
  }

  const {Component} = SECTIONS[section]
  return (
    <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
      <ThemeButtons />
      <Component />
    </View>
  )
}

function Home({
  onSelectSection,
}: {
  onSelectSection: (section: Section) => void
}) {
  const navigation = useNavigation<NavigationProp>()
  const requestDeviceGeolocation = useRequestDeviceGeolocation()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const inviteFriendsControl = Dialog.useDialogControl()

  return (
    <SettingsList.Container>
      <View style={[a.px_xl, a.pb_md]}>
        <ThemeButtons />
      </View>
      {(Object.keys(SECTIONS) as Section[]).map(section => (
        <SettingsList.PressableItem
          key={section}
          label={`Open ${section}`}
          onPress={() => onSelectSection(section)}>
          <SettingsList.ItemIcon icon={SECTIONS[section].icon} />
          <SettingsList.ItemText>{section}</SettingsList.ItemText>
          <SettingsList.Chevron />
        </SettingsList.PressableItem>
      ))}
      <SettingsList.Divider />
      <SettingsList.PressableItem
        label="Open Shared Prefs Tester"
        onPress={() => navigation.navigate('SharedPreferencesTester')}
        testID="sharedPrefsTestOpenBtn">
        <SettingsList.ItemIcon icon={WrenchIcon} />
        <SettingsList.ItemText>Shared Prefs Tester</SettingsList.ItemText>
        <SettingsList.Chevron />
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        label="Get GPS Location"
        onPress={() => {
          void requestDeviceGeolocation().then(req => {
            if (req.granted && req.location) {
              setDeviceGeolocation(req.location)
            }
          })
        }}>
        <SettingsList.ItemIcon icon={PinLocationIcon} />
        <SettingsList.ItemText>Get GPS Location</SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        label="Open invite friends sheet (APP-2142)"
        onPress={() => inviteFriendsControl.open()}>
        <SettingsList.ItemIcon icon={GroupIcon} />
        <SettingsList.ItemText>
          Open invite friends sheet (APP-2142)
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <InviteFriendsDialog control={inviteFriendsControl} />
    </SettingsList.Container>
  )
}

function ThemeButtons() {
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  return (
    <View style={[a.flex_row, a.align_start, a.gap_md]}>
      <Button
        color="primary"
        size="small"
        label='Set theme to "system"'
        onPress={() => setColorMode('system')}>
        <ButtonText>System</ButtonText>
      </Button>
      <Button
        color="secondary"
        size="small"
        label='Set theme to "light"'
        onPress={() => setColorMode('light')}>
        <ButtonText>Light</ButtonText>
      </Button>
      <Button
        color="secondary"
        size="small"
        label='Set theme to "dim"'
        onPress={() => {
          setColorMode('dark')
          setDarkTheme('dim')
        }}>
        <ButtonText>Dim</ButtonText>
      </Button>
      <Button
        color="secondary"
        size="small"
        label='Set theme to "dark"'
        onPress={() => {
          setColorMode('dark')
          setDarkTheme('dark')
        }}>
        <ButtonText>Dark</ButtonText>
      </Button>
    </View>
  )
}

function ThemingSection() {
  return (
    <>
      <ThemeProvider theme="light">
        <Theming />
      </ThemeProvider>
      <ThemeProvider theme="dim">
        <Theming />
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <Theming />
      </ThemeProvider>
    </>
  )
}
