import {Pressable, ScrollView, StyleSheet, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createHitslop, HITSLOP_10} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {Link} from '#/view/com/util/Link'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
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
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()

  return (
    <Layout.Content
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled">
      <View style={[a.w_full, a.px_md]}>
        {(searchHistory.length > 0 || selectedProfiles.length > 0) && (
          <Text style={[a.text_md, a.font_bold, a.p_md]}>
            <Trans>Recent Searches</Trans>
          </Text>
        )}
        {selectedProfiles.length > 0 && (
          <View
            style={[
              styles.selectedProfilesContainer,
              !gtMobile && styles.selectedProfilesContainerMobile,
            ]}>
            <BlockDrawerGesture>
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                style={[
                  a.flex_row,
                  a.flex_nowrap,
                  {marginHorizontal: tokens.space._2xl * -1},
                ]}
                contentContainerStyle={[a.px_2xl, a.border_0]}>
                {moderationOpts &&
                  selectedProfiles
                    .slice(0, 5)
                    .map(profile => (
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
          <View style={[a.pl_md, a.pr_xs, a.mt_md]}>
            {searchHistory.slice(0, 5).map((historyItem, index) => (
              <View key={index} style={[a.flex_row, a.align_center, a.mt_xs]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onItemClick(historyItem)}
                  hitSlop={HITSLOP_10}
                  style={[a.flex_1, a.py_md]}>
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
  const {gtMobile} = useBreakpoints()
  const t = useTheme()

  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const verification = useSimpleVerificationState({profile})

  return (
    <View style={[styles.profileItem, !gtMobile && styles.profileItemMobile]}>
      <Link
        href={makeProfileLink(profile)}
        title={profile.handle}
        asAnchor
        anchorNoUnderline
        onBeforePress={onPress}
        style={[a.align_center, a.w_full]}>
        <UserAvatar
          avatar={profile.avatar}
          type={profile.associated?.labeler ? 'labeler' : 'user'}
          size={60}
          moderation={moderation.ui('avatar')}
        />
        <View style={styles.profileName}>
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_center,
              web([a.flex_1]),
            ]}>
            <Text
              emoji
              style={[a.text_xs, a.leading_snug, a.self_start]}
              numberOfLines={1}>
              {name}
            </Text>
            {verification.showBadge && (
              <View style={[a.pl_xs]}>
                <VerificationCheck
                  width={12}
                  verifier={verification.role === 'verifier'}
                />
              </View>
            )}
          </View>
        </View>
      </Link>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Remove profile`)}
        accessibilityHint={_(msg`Removes profile from search history`)}
        hitSlop={createHitslop(6)}
        style={styles.profileRemoveBtn}
        onPress={onRemove}>
        <XIcon size="xs" style={t.atoms.text_contrast_low} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  selectedProfilesContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    height: 80,
  },
  selectedProfilesContainerMobile: {
    height: 100,
  },
  profileItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 78,
  },
  profileItemMobile: {
    width: 70,
  },
  profileName: {
    width: 78,
    marginTop: 6,
  },
  profileRemoveBtn: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
