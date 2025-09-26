import {Keyboard, View} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  moderateFeedGenerator,
  moderateProfile,
  type ModerationOpts,
  type ModerationUI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {DISCOVER_FEED_URI, STARTER_PACK_MAX_SIZE} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {
  type WizardAction,
  type WizardState,
} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Checkbox} from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

function WizardListCard({
  type,
  btnType,
  displayName,
  subtitle,
  onPress,
  avatar,
  included,
  disabled,
  moderationUi,
}: {
  type: 'user' | 'algo'
  btnType: 'checkbox' | 'remove'
  profile?: AppBskyActorDefs.ProfileViewBasic
  feed?: AppBskyFeedDefs.GeneratorView
  displayName: string
  subtitle: string
  onPress: () => void
  avatar?: string
  included?: boolean
  disabled?: boolean
  moderationUi: ModerationUI
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Toggle.Item
      name={type === 'user' ? _(msg`Person toggle`) : _(msg`Feed toggle`)}
      label={
        included
          ? _(msg`Remove ${displayName} from starter pack`)
          : _(msg`Add ${displayName} to starter pack`)
      }
      value={included}
      disabled={btnType === 'remove' || disabled}
      onChange={onPress}
      style={[
        a.flex_row,
        a.align_center,
        a.px_lg,
        a.py_md,
        a.gap_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <UserAvatar
        size={45}
        avatar={avatar}
        moderation={moderationUi}
        type={type}
      />
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text
          emoji
          style={[
            a.flex_1,
            a.font_semi_bold,
            a.text_md,
            a.leading_tight,
            a.self_start,
          ]}
          numberOfLines={1}>
          {displayName}
        </Text>
        <Text
          style={[a.flex_1, a.leading_tight, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {btnType === 'checkbox' ? (
        <Checkbox />
      ) : !disabled ? (
        <Button
          label={_(msg`Remove`)}
          variant="solid"
          color="secondary"
          size="small"
          style={[a.self_center, {marginLeft: 'auto'}]}
          onPress={onPress}>
          <ButtonText>
            <Trans>Remove</Trans>
          </ButtonText>
        </Button>
      ) : null}
    </Toggle.Item>
  )
}

export function WizardProfileCard({
  btnType,
  state,
  dispatch,
  profile,
  moderationOpts,
}: {
  btnType: 'checkbox' | 'remove'
  state: WizardState
  dispatch: (action: WizardAction) => void
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const {currentAccount} = useSession()

  // Determine the "main" profile for this starter pack - either targetDid or current account
  const targetProfileDid = state.targetDid || currentAccount?.did
  const isTarget = profile.did === targetProfileDid
  const included = isTarget || state.profiles.some(p => p.did === profile.did)
  const disabled =
    isTarget ||
    (!included && state.profiles.length >= STARTER_PACK_MAX_SIZE - 1)
  const moderationUi = moderateProfile(profile, moderationOpts).ui('avatar')
  const displayName = profile.displayName
    ? sanitizeDisplayName(profile.displayName)
    : `@${sanitizeHandle(profile.handle)}`

  const onPress = () => {
    if (disabled) return

    Keyboard.dismiss()
    if (profile.did === targetProfileDid) return

    if (!included) {
      dispatch({type: 'AddProfile', profile})
    } else {
      dispatch({type: 'RemoveProfile', profileDid: profile.did})
    }
  }

  return (
    <WizardListCard
      type="user"
      btnType={btnType}
      displayName={displayName}
      subtitle={`@${sanitizeHandle(profile.handle)}`}
      onPress={onPress}
      avatar={profile.avatar}
      included={included}
      disabled={disabled}
      moderationUi={moderationUi}
    />
  )
}

export function WizardFeedCard({
  btnType,
  generator,
  state,
  dispatch,
  moderationOpts,
}: {
  btnType: 'checkbox' | 'remove'
  generator: AppBskyFeedDefs.GeneratorView
  state: WizardState
  dispatch: (action: WizardAction) => void
  moderationOpts: ModerationOpts
}) {
  const isDiscover = generator.uri === DISCOVER_FEED_URI
  const included = isDiscover || state.feeds.some(f => f.uri === generator.uri)
  const disabled = isDiscover || (!included && state.feeds.length >= 3)
  const moderationUi = moderateFeedGenerator(generator, moderationOpts).ui(
    'avatar',
  )

  const onPress = () => {
    if (disabled) return

    Keyboard.dismiss()
    if (included) {
      dispatch({type: 'RemoveFeed', feedUri: generator.uri})
    } else {
      dispatch({type: 'AddFeed', feed: generator})
    }
  }

  return (
    <WizardListCard
      type="algo"
      btnType={btnType}
      displayName={sanitizeDisplayName(generator.displayName)}
      subtitle={`Feed by @${sanitizeHandle(generator.creator.handle)}`}
      onPress={onPress}
      avatar={generator.avatar}
      included={included}
      disabled={disabled}
      moderationUi={moderationUi}
    />
  )
}
