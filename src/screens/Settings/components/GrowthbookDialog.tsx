import {useState} from 'react'
import {Pressable, View} from 'react-native'
import * as Clipboard from 'expo-clipboard'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotate} from '#/components/icons/ArrowRotate'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {Features, features, refresh} from '#/analytics/features'

export function GrowthbookDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <GrowthbookDialogInner />
    </Dialog.Outer>
  )
}

function GrowthbookDialogInner() {
  const t = useTheme()

  const [isRefreshing, setIsRefreshing] = useState(false)

  return (
    <Dialog.ScrollableInner
      label="Growthbook features"
      header={
        <Dialog.Header>
          <Dialog.HeaderText>Growthbook</Dialog.HeaderText>
          <Dialog.Close />
        </Dialog.Header>
      }>
      <View
        style={[
          a.gap_sm,
          a.pb_lg,
          a.mb_lg,
          native(a.pt_lg),
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <CurrentProfile />
      </View>
      <View style={[a.pb_lg, a.mb_lg, a.border_b, t.atoms.border_contrast_low]}>
        <RefreshButton
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />
      </View>
      <View style={[a.gap_md]}>
        {Object.entries(Features).map(([name, key]) => (
          <FeatureRow
            key={key}
            name={name}
            featureKey={key}
            isRefreshing={isRefreshing}
          />
        ))}
      </View>
    </Dialog.ScrollableInner>
  )
}

function RefreshButton({
  isRefreshing,
  setIsRefreshing,
}: {
  isRefreshing: boolean
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const onPress = () => {
    setIsRefreshing(true)
    refresh({strategy: 'prefer-fresh-gates'})
      .then(() => {
        Toast.show('Refreshed feature flags', {type: 'success'})
      })
      .catch(() => {
        Toast.show('Failed to refresh feature flags', {type: 'error'})
      })
      .finally(() => {
        setIsRefreshing(false)
      })
  }

  return (
    <Button
      label="Refresh feature flags"
      onPress={onPress}
      disabled={isRefreshing}
      color="secondary"
      size="small">
      <ButtonIcon icon={isRefreshing ? Loader : ArrowRotate} />
      <ButtonText>Refresh feature flags</ButtonText>
    </Button>
  )
}

function FeatureRow({
  name,
  featureKey,
  isRefreshing,
}: {
  name: string
  featureKey: string
  isRefreshing: boolean
}) {
  const t = useTheme()
  const value = features.evalFeature(featureKey).value

  const onPress = () => {
    void Clipboard.setStringAsync(featureKey)
    Toast.show('Copied feature flag key to clipboard', {type: 'success'})
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Copy feature flag key"
      accessibilityHint="Copies the feature flag key to the clipboard"
      onPress={onPress}
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_md,
        a.pb_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_1]}>
        <Text style={[a.text_sm, a.font_bold]}>{name}</Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {featureKey}
        </Text>
      </View>
      {isRefreshing ? <Loader size="sm" /> : <FeatureValue value={value} />}
    </Pressable>
  )
}

function CurrentProfile() {
  const t = useTheme()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})

  if (!currentAccount) {
    return (
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        No active account
      </Text>
    )
  }

  const onPressDid = () => {
    void Clipboard.setStringAsync(currentAccount.did)
    Toast.show('Copied did to clipboard', {type: 'success'})
  }

  return profile && moderationOpts ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Copy DID"
      accessibilityHint="Copies your DID to the clipboard"
      onPress={onPressDid}
      hitSlop={native({top: 8, bottom: 8, left: 8, right: 8})}
      style={[a.gap_sm]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar
          profile={profile}
          moderationOpts={moderationOpts}
          disabledPreview
        />
        <ProfileCard.NameAndHandle
          profile={profile}
          moderationOpts={moderationOpts}
        />
      </ProfileCard.Header>
    </Pressable>
  ) : null
}

function FeatureValue({value}: {value: unknown}) {
  const t = useTheme()

  let label: string
  let color: string
  if (value === true) {
    label = 'true'
    color = t.palette.positive_500
  } else if (value === false) {
    label = 'false'
    color = t.palette.negative_500
  } else if (value === null || value === undefined) {
    label = 'null'
    color = t.palette.contrast_500
  } else {
    label = JSON.stringify(value)
    color = t.palette.contrast_700
  }

  return <Text style={[a.text_sm, a.font_bold, {color}]}>{label}</Text>
}
