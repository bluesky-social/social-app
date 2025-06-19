import {useCallback, useMemo} from 'react'
import {type ListRenderItemInfo, Text as RNText, View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useInfiniteQuery} from '@tanstack/react-query'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {useAgent} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {Bell_Filled_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
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
  const agent = useAgent()
  const moderationOpts = useModerationOpts()

  // TODO: Fetch subscriptions
  const {
    data: subscriptions,
    isPending,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['TEMP'],
    queryFn: async ({pageParam}) => {
      const response = await agent.getFollows({
        actor: agent.assertDid,
        cursor: pageParam,
      })
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: prev => prev.cursor,
  })

  const items = useMemo(() => {
    if (!subscriptions) return []
    return subscriptions?.pages.flatMap(page => page.follows)
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
          <View style={[a.px_xl, a.py_md]}>
            {!isPending ? (
              <Admonition.Outer type="tip">
                <Admonition.Row>
                  <Admonition.Icon />
                  <View style={[a.flex_1, a.gap_sm]}>
                    <Admonition.Text>
                      <Trans>
                        Enable notifications for an account by visiting their
                        profile and pressing the{' '}
                        <RNText
                          style={[a.font_bold, t.atoms.text_contrast_high]}>
                          bell icon
                        </RNText>{' '}
                        <BellIcon
                          size="xs"
                          style={t.atoms.text_contrast_high}
                        />
                        .
                      </Trans>
                    </Admonition.Text>
                    <Admonition.Text>
                      <Trans>
                        By default, only accounts you follow can receive alerts
                        from you – this can be changed in{' '}
                        <InlineLinkText
                          label={_(msg`Privacy & Security settings`)}
                          to={{screen: 'PrivacyAndSecuritySettings'}}
                          style={[a.font_bold]}>
                          Settings &rarr; Privacy &amp; Security
                        </InlineLinkText>
                        .
                      </Trans>
                    </Admonition.Text>
                  </View>
                </Admonition.Row>
              </Admonition.Outer>
            ) : (
              <View style={[a.flex_1, a.align_center, a.pt_xl]}>
                <Loader size="lg" />
              </View>
            )}
          </View>
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
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const {_} = useLingui()
  const t = useTheme()

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
              <Trans>Posts, Replies</Trans>
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
            variant="solid">
            <ButtonText>
              <Trans>Edit</Trans>
            </ButtonText>
          </Button>
        </ProfileCard.Header>
        {/* <ProfileCard.Labels profile={profile} moderationOpts={moderationOpts} /> */}
      </ProfileCard.Outer>
    </View>
  )
}
