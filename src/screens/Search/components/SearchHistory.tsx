import {Pressable, ScrollView, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createHitslop, HITSLOP_10} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import type * as bsky from '#/types/bsky'

export function SearchHistory({
  searchHistory,
  selectedProfiles,
  onItemClick,
  onProfileClick,
  onRemoveItemClick,
  onRemoveProfileClick,
}: {
  searchHistory: string[]
  selectedProfiles: bsky.profile.AnyProfileView[]
  onItemClick: (item: string) => void
  onProfileClick: (profile: bsky.profile.AnyProfileView) => void
  onRemoveItemClick: (item: string) => void
  onRemoveProfileClick: (profile: bsky.profile.AnyProfileView) => void
}) {
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()

  return (
    <Layout.Content
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled">
      <View style={[a.w_full, a.gap_md]}>
        {(searchHistory.length > 0 || selectedProfiles.length > 0) && (
          <View style={[a.px_lg, a.pt_sm]}>
            <Text style={[a.text_md, a.font_bold]}>
              <Trans>Recent Searches</Trans>
            </Text>
          </View>
        )}

        {selectedProfiles.length > 0 && (
          <View>
            <BlockDrawerGesture>
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  a.px_lg,
                  a.flex_row,
                  a.flex_nowrap,
                  a.gap_xl,
                ]}>
                {moderationOpts &&
                  selectedProfiles.map(profile => (
                    <RecentProfileItem
                      key={profile.did}
                      profile={profile}
                      moderationOpts={moderationOpts}
                      onPress={() => onProfileClick(profile)}
                      onRemove={() => onRemoveProfileClick(profile)}
                    />
                  ))}
              </ScrollView>
            </BlockDrawerGesture>
          </View>
        )}

        {searchHistory.length > 0 && (
          <View style={[a.px_lg, a.pt_sm]}>
            {searchHistory.slice(0, 5).map((historyItem, index) => (
              <View key={index} style={[a.flex_row, a.align_center]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onItemClick(historyItem)}
                  hitSlop={HITSLOP_10}
                  style={[a.flex_1, a.py_sm]}>
                  <Text style={[a.text_md]}>{historyItem}</Text>
                </Pressable>
                <Button
                  label={_(msg`Remove ${historyItem}`)}
                  onPress={() => onRemoveItemClick(historyItem)}
                  size="small"
                  variant="ghost"
                  color="secondary"
                  shape="round">
                  <ButtonIcon icon={XIcon} />
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </Layout.Content>
  )
}

function RecentProfileItem({
  profile,
  moderationOpts,
  onPress,
  onRemove,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onPress: () => void
  onRemove: () => void
}) {
  const {_} = useLingui()
  const width = 80

  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const verification = useSimpleVerificationState({profile})

  return (
    <View style={[a.relative]}>
      <Link
        to={makeProfileLink(profile)}
        label={profile.handle}
        onPress={onPress}
        style={[
          a.flex_col,
          a.align_center,
          a.gap_xs,
          {
            width,
          },
        ]}>
        <UserAvatar
          avatar={profile.avatar}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
          size={width - 8}
          moderation={moderation.ui('avatar')}
        />
        <View style={[a.flex_row, a.align_center, a.justify_center, a.w_full]}>
          <Text emoji style={[a.text_xs, a.leading_snug]} numberOfLines={1}>
            {name}
          </Text>
          {verification.showBadge && (
            <View style={[a.pl_2xs]}>
              <VerificationCheck
                width={10}
                verifier={verification.role === 'verifier'}
              />
            </View>
          )}
        </View>
      </Link>
      <Button
        label={_(msg`Remove profile`)}
        hitSlop={createHitslop(6)}
        size="tiny"
        variant="outline"
        color="secondary"
        shape="round"
        onPress={onRemove}
        style={[
          a.absolute,
          {
            top: 0,
            right: 0,
            height: 18,
            width: 18,
          },
        ]}>
        <ButtonIcon icon={XIcon} />
      </Button>
    </View>
  )
}
