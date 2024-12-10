import {useState} from 'react'
import {Alert, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {isAndroid} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {AppIcon, AppIconSet, useAppIconSets} from './components/AppIcon'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppIconSettings'>
export function AppIconSettingsScreen({}: Props) {
  const {_} = useLingui()
  const sets = useAppIconSets()
  const [currentAppIcon, setCurrentAppIcon] = useState(() =>
    getAppIconName(DynamicAppIcon.getAppIcon()),
  )

  const onSetAppIcon = (icon: string) => {
    if (isAndroid) {
      const next =
        sets.defaults.find(i => i.id === icon) ??
        sets.core.find(i => i.id === icon)
      Alert.alert(
        next
          ? _(msg`Change app icon to "${next.name}"`)
          : _(msg`Change app icon`),
        // to determine - can we stop this happening? -sfn
        _(msg`The app will be restarted`),
        [
          {
            text: _(msg`Cancel`),
            style: 'cancel',
          },
          {
            text: _(msg`OK`),
            onPress: () => {
              setCurrentAppIcon(setAppIcon(icon))
            },
            style: 'default',
          },
        ],
      )
    } else {
      setCurrentAppIcon(setAppIcon(icon))
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>App Icon</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content contentContainerStyle={[a.px_lg]}>
        <Text style={[a.text_xl, a.mt_lg, a.mb_md, a.font_heavy]}>
          <Trans>Default</Trans>
        </Text>
        <Group
          label={_(msg`Default icons`)}
          value={currentAppIcon}
          onChange={onSetAppIcon}>
          {sets.defaults.map((icon, i) => (
            <Row
              key={icon.id}
              icon={icon}
              isEnd={i === sets.defaults.length - 1}>
              <AppIcon icon={icon} key={icon.id} size={40} />
              <RowText>{icon.name}</RowText>
            </Row>
          ))}
        </Group>
        <Text style={[a.text_xl, a.mt_lg, a.mb_md, a.font_heavy]}>
          <Trans>Bluesky+</Trans>
        </Text>
        <Group
          label={_(msg`Bluesky+ icons`)}
          value={currentAppIcon}
          onChange={onSetAppIcon}>
          {sets.core.map((icon, i) => (
            <Row key={icon.id} icon={icon} isEnd={i === sets.core.length - 1}>
              <AppIcon icon={icon} key={icon.id} size={40} />
              <RowText>{icon.name}</RowText>
            </Row>
          ))}
        </Group>
      </Layout.Content>
    </Layout.Screen>
  )
}

function setAppIcon(icon: string) {
  if (icon === 'default_light') {
    return getAppIconName(DynamicAppIcon.setAppIcon(null))
  } else {
    return getAppIconName(DynamicAppIcon.setAppIcon(icon))
  }
}

function getAppIconName(icon: string | false) {
  if (!icon || icon === 'DEFAULT') {
    return 'default_light'
  } else {
    return icon
  }
}

function Group({
  children,
  label,
  value,
  onChange,
}: {
  children: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Toggle.Group
      type="radio"
      label={label}
      values={[value]}
      maxSelections={1}
      onChange={vals => {
        if (vals[0]) onChange(vals[0])
      }}>
      <View style={[a.flex_1, a.rounded_md, a.overflow_hidden]}>
        {children}
      </View>
    </Toggle.Group>
  )
}

function Row({
  icon,
  children,
  isEnd,
}: {
  icon: AppIconSet
  children: React.ReactNode
  isEnd: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Toggle.Item label={_(msg`Set app icon to ${icon.name}`)} name={icon.id}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.px_lg,
            a.py_md,
            a.flex_row,
            a.gap_lg,
            a.align_center,
            t.atoms.bg_contrast_25,
            (hovered || pressed) && t.atoms.bg_contrast_50,
            t.atoms.border_contrast_high,
            !isEnd && a.border_b,
          ]}>
          {children}
          <Toggle.Radio />
        </View>
      )}
    </Toggle.Item>
  )
}

function RowText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[a.text_md, a.font_bold, a.flex_1, t.atoms.text_contrast_medium]}
      emoji>
      {children}
    </Text>
  )
}
