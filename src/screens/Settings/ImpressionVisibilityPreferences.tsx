import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  type ImpressionVisibilityKey,
  useImpressionVisibilityPrefs,
  useSetImpressionVisibility,
} from '#/state/preferences/impression-visibility'
import {atoms as a, platform, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'
import {ItemTextWithSubtitle} from './NotificationSettings/components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<CommonNavigatorParams>

type ImpressionConfig = {
  key: ImpressionVisibilityKey
  label: string
}

const IMPRESSIONS: ImpressionConfig[] = [
  {key: 'likes', label: 'Likes'},
  {key: 'reposts', label: 'Reposts'},
  {key: 'replies', label: 'Replies'},
  {key: 'quotes', label: 'Quote posts'},
  {key: 'bookmarks', label: 'Saves'},
]

function ImpressionSection({
  titleText,
  subtitleText,
  getValue,
  onToggle,
}: {
  titleText: React.ReactNode
  subtitleText: React.ReactNode
  getValue: (key: ImpressionVisibilityKey) => boolean
  onToggle: (key: ImpressionVisibilityKey, val: boolean) => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <>
      <SettingsList.Item style={[a.align_start]}>
        <SettingsList.ItemIcon icon={EyeSlashIcon} />
        <ItemTextWithSubtitle
          bold
          titleText={titleText}
          subtitleText={subtitleText}
        />
      </SettingsList.Item>
      <View style={[a.px_xl, a.pt_md, a.gap_sm]}>
        {IMPRESSIONS.map(impression => (
          <Toggle.Item
            key={impression.key}
            label={_(msg`Show ${impression.label}`)}
            name={`${impression.key}`}
            value={!getValue(impression.key)}
            onChange={val => onToggle(impression.key, !val)}
            style={[
              a.py_xs,
              platform({
                native: [a.justify_between],
                web: [a.flex_row_reverse, a.gap_sm],
              }),
            ]}>
            <Toggle.LabelText
              style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
              {impression.label}
            </Toggle.LabelText>
            <Toggle.Platform />
          </Toggle.Item>
        ))}
        <SettingsList.Divider />
      </View>
    </>
  )
}

export function ImpressionVisibilitySettingsScreen({}: Props) {
  const t = useTheme()
  const prefs = useImpressionVisibilityPrefs()
  const setVisibility = useSetImpressionVisibility()

  const getOwnValue = (key: ImpressionVisibilityKey) => {
    const v = prefs[key] ?? 'show'
    return v === 'hideOwn' || v === 'hideAll'
  }

  const getOthersValue = (key: ImpressionVisibilityKey) => {
    const v = prefs[key] ?? 'show'
    return v === 'hideOthers' || v === 'hideAll'
  }

  const onToggleOwn = (key: ImpressionVisibilityKey, val: boolean) => {
    const othersChecked = getOthersValue(key)
    setVisibility(
      key,
      val
        ? othersChecked
          ? 'hideAll'
          : 'hideOwn'
        : othersChecked
          ? 'hideOthers'
          : 'show',
    )
  }

  const onToggleOthers = (key: ImpressionVisibilityKey, val: boolean) => {
    const ownChecked = getOwnValue(key)
    setVisibility(
      key,
      val
        ? ownChecked
          ? 'hideAll'
          : 'hideOthers'
        : ownChecked
          ? 'hideOwn'
          : 'show',
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Impression Visibility</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>
                Control which post counts are visible to you. These settings
                only affect your own view — counts are not hidden from others.
              </Trans>
            </Text>
          </SettingsList.Item>

          <SettingsList.Divider />

          <ImpressionSection
            titleText={<Trans>Your posts</Trans>}
            subtitleText={<Trans>Show counts on posts you made</Trans>}
            getValue={getOwnValue}
            onToggle={onToggleOwn}
          />

          <ImpressionSection
            titleText={<Trans>Others' posts</Trans>}
            subtitleText={<Trans>Show counts on posts by other people</Trans>}
            getValue={getOthersValue}
            onToggle={onToggleOthers}
          />
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
