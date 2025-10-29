import {useCallback, useMemo} from 'react'
import {type ListRenderItemInfo, Text as RNText, View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActivitySubscriptionsQuery} from '#/state/queries/activity-subscriptions'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {SubscribeProfileDialog} from '#/components/activity-notifications/SubscribeProfileDialog'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BellRinging_Filled_Corner0_Rounded as BellRingingFilledIcon} from '#/components/icons/BellRinging'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'
import {PreferenceControls} from './components/PreferenceControls'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'ActivityNotificationSettings'
>
export function ActivityNotificationSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {data: preferences, isError} = useNotificationSettingsQuery()

  const moderationOpts = useModerationOpts()

  const {
    data: subscriptions,
    isPending,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useActivitySubscriptionsQuery()

  const items = useMemo(() => {
    if (!subscriptions) return []
    return subscriptions?.pages.flatMap(page => page.subscriptions)
  }, [subscriptions])

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<bsky.profile.AnyProfileView>) => {
      if (!moderationOpts) return null
      return (
        <ActivitySubscriptionCard
          profile={item}
          moderationOpts={moderationOpts}
        />
      )
    },
    [moderationOpts],
  )

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <List
        ListHeaderComponent={
          <SettingsList.Container>
            <SettingsList.Item style={[a.align_start]}>
              <SettingsList.ItemIcon icon={BellRingingIcon} />
              <ItemTextWithSubtitle
                bold
                titleText={<Trans>Activity from others</Trans>}
                subtitleText={
                  <Trans>
                    Get notified about posts and replies from accounts you
                    choose.
                  </Trans>
                }
              />
            </SettingsList.Item>
            {isError ? (
              <View style={[a.px_lg, a.pt_md]}>
                <Admonition.Admonition type="error">
                  <Trans>Failed to load notification settings.</Trans>
                </Admonition.Admonition>
              </View>
            ) : (
              <PreferenceControls
                name="subscribedPost"
                preference={preferences?.subscribedPost}
              />
            )}
          </SettingsList.Container>
        }
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={4}
        ListEmptyComponent={
          error ? null : (
            <View style={[a.px_xl, a.py_md]}>
              {!isPending ? (
                <Admonition.Outer type="tip">
                  <Admonition.Row>
                    <Admonition.Icon />
                    <Admonition.Content>
                      <Admonition.Text>
                        <Trans>
                          Enable notifications for an account by visiting their
                          profile and pressing the{' '}
                          <RNText
                            style={[
                              a.font_semi_bold,
                              t.atoms.text_contrast_high,
                            ]}>
                            bell icon
                          </RNText>{' '}
                          <BellRingingFilledIcon
                            size="xs"
                            style={t.atoms.text_contrast_high}
                          />
                          .
                        </Trans>
                      </Admonition.Text>
                      <Admonition.Text>
                        <Trans>
                          If you want to restrict who can receive notifications
                          for your account's activity, you can change this in{' '}
                          <InlineLinkText
                            label={_(msg`Privacy and Security settings`)}
                            to={{screen: 'ActivityPrivacySettings'}}
                            style={[a.font_semi_bold]}>
                            Settings &rarr; Privacy and Security
                          </InlineLinkText>
                          .
                        </Trans>
                      </Admonition.Text>
                    </Admonition.Content>
                  </Admonition.Row>
                </Admonition.Outer>
              ) : (
                <View style={[a.flex_1, a.align_center, a.pt_xl]}>
                  <Loader size="lg" />
                </View>
              )}
            </View>
          )
        }
        ListFooterComponent={
          <ListFooter
            style={[items.length === 0 && a.border_transparent]}
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={fetchNextPage}
            hasNextPage={hasNextPage}
          />
        }
        windowSize={11}
      />
    </Layout.Screen>
  )
}

function keyExtractor(item: bsky.profile.AnyProfileView) {
  return item.did
}

function ActivitySubscriptionCard({
  profile: profileUnshadowed,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const profile = useProfileShadow(profileUnshadowed)
  const control = useDialogControl()
  const {_} = useLingui()
  const t = useTheme()

  const preview = useMemo(() => {
    const actSub = profile.viewer?.activitySubscription
    if (actSub?.post && actSub?.reply) {
      return _(msg`Posts, Replies`)
    } else if (actSub?.post) {
      return _(msg`Posts`)
    } else if (actSub?.reply) {
      return _(msg`Replies`)
    }
    return _(msg`None`)
  }, [_, profile.viewer?.activitySubscription])

  return (
    <View style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <View style={[a.flex_1, a.gap_2xs]}>
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
              inline
            />
            <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
              {preview}
            </Text>
          </View>
          <Button
            label={_(
              msg`Edit notifications from ${createSanitizedDisplayName(
                profile,
              )}`,
            )}
            size="small"
            color="primary"
            variant="solid"
            onPress={control.open}>
            <ButtonText>
              <Trans>Edit</Trans>
            </ButtonText>
          </Button>
        </ProfileCard.Header>
      </ProfileCard.Outer>

      <SubscribeProfileDialog
        control={control}
        profile={profile}
        moderationOpts={moderationOpts}
        includeProfile
      />
    </View>
  )
}
