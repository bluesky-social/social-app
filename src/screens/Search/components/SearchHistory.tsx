import {ScrollView, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {createHitslop} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {
  countActiveFilters,
  parseHistoryEntry,
} from '#/screens/Search/searchParams'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function SearchHistory({
  searchHistory,
  selectedProfiles,
  onItemClick,
  onProfileClick,
  onRemoveItemClick,
  onRemoveProfileClick,
  onClearAll,
}: {
  searchHistory: string[]
  selectedProfiles: bsky.profile.AnyProfileView[]
  onItemClick: (item: string) => void
  onProfileClick: (profile: bsky.profile.AnyProfileView) => void
  onRemoveItemClick: (item: string) => void
  onRemoveProfileClick: (profile: bsky.profile.AnyProfileView) => void
  onClearAll: () => void
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const clearAllPromptControl = Prompt.usePromptControl()

  const totalCount = searchHistory.length + selectedProfiles.length

  return (
    <Layout.Content
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled">
      <View style={[a.w_full, a.gap_md]}>
        {totalCount > 0 && (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.gap_md,
              a.px_lg,
              a.pt_sm,
            ]}>
            <Text style={[a.text_md, a.font_semi_bold]}>
              <Trans>Recent searches</Trans>
            </Text>
            {totalCount > 1 && (
              <Button
                label={l`Clear all recent searches`}
                onPress={() => clearAllPromptControl.open()}
                size="tiny"
                color="secondary"
                testID="searchHistoryClearAllBtn">
                <ButtonText>
                  <Trans context="action">Clear all</Trans>
                </ButtonText>
              </Button>
            )}
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
                  selectedProfiles.map((profile, index) => (
                    <RecentProfileItem
                      key={profile.did}
                      profile={profile}
                      moderationOpts={moderationOpts}
                      onPress={() => {
                        ax.metric('search:recent:press', {
                          profileDid: profile.did,
                          position: index,
                        })
                        onProfileClick(profile)
                      }}
                      onRemove={() => onRemoveProfileClick(profile)}
                    />
                  ))}
              </ScrollView>
            </BlockDrawerGesture>
          </View>
        )}

        {searchHistory.length > 0 && (
          <View style={[a.pt_sm]}>
            {searchHistory.slice(0, 5).map((historyItem, index) => {
              const {q, filters} = parseHistoryEntry(historyItem)
              const filterCount = countActiveFilters(filters)

              return (
                <SearchHistoryItem
                  key={index}
                  q={q}
                  filterCount={filterCount}
                  onPress={() => {
                    ax.metric('search:query', {
                      source: 'history',
                      filterCount,
                    })
                    onItemClick(historyItem)
                  }}
                  onRemove={() => onRemoveItemClick(historyItem)}
                />
              )
            })}
          </View>
        )}
      </View>

      <Prompt.Basic
        control={clearAllPromptControl}
        title={l`Clear all recent searches?`}
        description={l`This can’t be undone, and all of your recent searches will be removed.`}
        onConfirm={() => {
          ax.metric('search:recent:clearAll', {
            termCount: searchHistory.length,
            profileCount: selectedProfiles.length,
          })
          onClearAll()
        }}
        confirmButtonCta={l({message: 'Clear', context: 'action'})}
        cancelButtonCta={l`Cancel`}
        confirmButtonColor="negative"
      />
    </Layout.Content>
  )
}

function SearchHistoryItem({
  q,
  filterCount,
  onPress,
  onRemove,
}: {
  q: string
  filterCount: number
  onPress: () => void
  onRemove: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <View style={[a.flex_row, a.align_center]}>
      <Button label={l`Search for ${q}`} onPress={onPress} style={[a.flex_1]}>
        {({hovered, focused, pressed}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.px_lg,
              a.py_md,
              a.pr_5xl,
              (hovered || focused || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <Text
              emoji
              style={[a.text_md, a.leading_snug, a.flex_shrink]}
              numberOfLines={1}>
              {q}
            </Text>
            {filterCount > 0 ? (
              <View
                style={[
                  a.flex_shrink_0,
                  a.rounded_sm,
                  a.px_sm,
                  a.py_2xs,
                  t.atoms.bg_contrast_25,
                ]}>
                <Text
                  style={[
                    a.text_xs,
                    a.font_medium,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Plural
                    value={filterCount}
                    one="+# filter"
                    other="+# filters"
                  />
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Button>
      <Button
        label={l`Remove ${q}`}
        onPress={onRemove}
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
        style={[a.absolute, {right: 16}, a.bg_transparent]}>
        <ButtonIcon icon={XIcon} />
      </Button>
    </View>
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
  const {t: l} = useLingui()
  const width = 80

  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

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
          <ProfileBadges profile={profile} size="xs" style={[a.pl_xs]} />
        </View>
      </Link>
      <Button
        label={l`Remove profile`}
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
