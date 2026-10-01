import {useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {
  useModerationInboxAccountStatusQuery,
  useModerationInboxActionedSubjectsQuery,
  useModerationInboxReportsQuery,
  useModerationInboxUnreadCountQuery,
  useUpdateModerationInboxSeenMutation,
} from '#/state/queries/moderation-inbox'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {Inbox_Stroke2_Corner2_Rounded_Large as InboxIcon} from '#/components/icons/Inbox'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
import * as Layout from '#/components/Layout'
import {createStaticClick, Link, SimpleInlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/analytics'
import {type tools} from '#/lexicons'
import {AccountStatus} from './components/AccountStatus'
import {FilterMenu} from './components/FilterMenu'
import {YourAccountRow} from './components/YourAccountRow'
import {YourReportRow} from './components/YourReportRow'
import {type ActionedSubject} from './hooks/useActionedSubjectLabels'

type ReportFilter = 'all' | 'pending' | 'resolved' | 'unread'
type InboxReport = tools.ozone.inbox.listReports.$OutputBody['reports'][number]

export function ModerationInboxScreen() {
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxScreen">
      <Pager
        testID="moderationInboxPager"
        renderTabBar={props => (
          <Layout.Center>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content align="left">
                <Layout.Header.TitleText>
                  <Trans>Moderation inbox</Trans>
                </Layout.Header.TitleText>
              </Layout.Header.Content>
              <Layout.Header.Slot>
                <Link
                  testID="moderationInboxSettingsBtn"
                  to={{screen: 'ModerationInboxSettings'}}
                  label={l`Moderation inbox settings`}
                  size="small"
                  variant="ghost"
                  color="secondary"
                  shape="round"
                  style={[a.justify_center]}>
                  <ButtonIcon icon={SettingsIcon} size="lg" />
                </Link>
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            <TabBar
              testID="moderationInboxTabs"
              items={[l`Your reports`, l`Your account`]}
              align="left"
              {...props}
            />
          </Layout.Center>
        )}>
        <YourReports />
        <YourAccount />
      </Pager>
    </Layout.Screen>
  )
}

function YourReports() {
  const t = useTheme()
  const {t: l} = useLingui()

  const [isPTRing, setIsPTRing] = useState(false)
  const [filter, setFilter] = useState<ReportFilter>('all')
  const reportsQuery = useModerationInboxReportsQuery(filter)
  const unreadCountQuery = useModerationInboxUnreadCountQuery()
  const markSeen = useUpdateModerationInboxSeenMutation()
  const reports = reportsQuery.data?.pages.flatMap(page => page.reports) ?? []
  const hasUnread = (unreadCountQuery.data?.unreadCounts.reports ?? 0) > 0
  const isLoading = reportsQuery.isLoading
  const isEmpty =
    reportsQuery.data !== undefined &&
    reports.length === 0 &&
    !reportsQuery.error
  const hideFilterMenu = isEmpty && filter === 'all'

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await Promise.all([reportsQuery.refetch(), unreadCountQuery.refetch()])
    } catch (err) {
      logger.error('Failed to refresh moderation inbox reports', {error: err})
    } finally {
      setIsPTRing(false)
    }
  }

  const onEndReached = async () => {
    if (
      reportsQuery.isFetchingNextPage ||
      !reportsQuery.hasNextPage ||
      reportsQuery.error
    ) {
      return
    }
    try {
      await reportsQuery.fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more moderation inbox reports', {
        error: err,
      })
    }
  }

  const listHeader = (
    <Layout.Center>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.px_lg,
          a.py_sm,
          a.border_b,
          t.atoms.border_contrast_low,
          {minHeight: 48},
        ]}>
        <FilterMenu filter={filter} setFilter={setFilter} />
        {hasUnread ? (
          <SimpleInlineLinkText
            label={l`Mark all reports as read`}
            style={[a.text_md, t.atoms.text]}
            {...createStaticClick(() => {
              markSeen.mutate(['reports'])
            })}>
            <Trans>Mark all as read</Trans>
          </SimpleInlineLinkText>
        ) : undefined}
      </View>
    </Layout.Center>
  )

  return (
    <List
      data={reports}
      keyExtractor={(report: InboxReport) => report.id.toString()}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      renderItem={({item}: ListRenderItemInfo<InboxReport>) => (
        <YourReportRow report={item} />
      )}
      ListHeaderComponent={hideFilterMenu || isLoading ? undefined : listHeader}
      ListEmptyComponent={
        isLoading ? (
          <View style={[a.flex_1, a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        ) : isEmpty ? (
          <InboxEmptyState
            message={
              filter === 'all'
                ? l`You haven’t reported anything yet`
                : l`No reports match this filter`
            }
          />
        ) : undefined
      }
      contentContainerStyle={isEmpty || isLoading ? a.flex_grow : undefined}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={reportsQuery.isFetchingNextPage}
          hasNextPage={reportsQuery.hasNextPage}
          error={cleanError(reportsQuery.error)}
          onRetry={reportsQuery.fetchNextPage}
        />
      }
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      desktopFixedHeight
      sideBorders={false}
    />
  )
}

function YourAccount() {
  const t = useTheme()
  const {t: l} = useLingui()

  const [isPTRing, setIsPTRing] = useState(false)
  const [filter, setFilter] = useState<ReportFilter>('all')
  const actionedSubjectsQuery = useModerationInboxActionedSubjectsQuery()
  const accountStatusQuery = useModerationInboxAccountStatusQuery()
  const unreadCountQuery = useModerationInboxUnreadCountQuery()
  const markSeen = useUpdateModerationInboxSeenMutation()
  const accountStanding = getKnownAccountStanding(
    accountStatusQuery.data?.standing,
  )
  const subjects =
    actionedSubjectsQuery.data?.pages.flatMap(page => page.subjects) ?? []
  const isEmpty =
    actionedSubjectsQuery.data !== undefined &&
    subjects.length === 0 &&
    !actionedSubjectsQuery.error
  const hideFilterMenu = isEmpty && filter === 'all'
  const unreadCounts = unreadCountQuery.data?.unreadCounts
  const hasUnread =
    (unreadCounts?.subjects ?? 0) + (unreadCounts?.accountStatus ?? 0) > 0

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await Promise.all([
        actionedSubjectsQuery.refetch(),
        accountStatusQuery.refetch(),
        unreadCountQuery.refetch(),
      ])
    } catch (err) {
      logger.error('Failed to refresh moderation inbox account', {error: err})
    } finally {
      setIsPTRing(false)
    }
  }

  const onEndReached = async () => {
    if (
      actionedSubjectsQuery.isFetchingNextPage ||
      !actionedSubjectsQuery.hasNextPage ||
      actionedSubjectsQuery.error
    ) {
      return
    }
    try {
      await actionedSubjectsQuery.fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more moderation inbox actions', {
        error: err,
      })
    }
  }

  const listHeader = (
    <Layout.Center>
      {!hideFilterMenu ? (
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_lg,
            a.px_lg,
            a.py_sm,
            a.border_b,
            t.atoms.border_contrast_low,
            {minHeight: 48},
          ]}>
          <FilterMenu filter={filter} setFilter={setFilter} />
          {hasUnread ? (
            <SimpleInlineLinkText
              label={l`Mark all actions as read`}
              style={[a.text_md, t.atoms.text]}
              {...createStaticClick(() => {
                markSeen.mutate(['subjects', 'accountStatus'])
              })}>
              <Trans>Mark all as read</Trans>
            </SimpleInlineLinkText>
          ) : undefined}
        </View>
      ) : undefined}
      {accountStanding ? <AccountStatus status={accountStanding} /> : undefined}
    </Layout.Center>
  )

  return (
    <List
      data={subjects}
      keyExtractor={getActionedSubjectKey}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      renderItem={({item}: ListRenderItemInfo<ActionedSubject>) => (
        <Layout.Center>
          <YourAccountRow item={item} unread={!item.isRead} />
        </Layout.Center>
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        isEmpty ? (
          <InboxEmptyState
            message={
              filter === 'all'
                ? l`No actions against you`
                : l`No actions match this filter`
            }
          />
        ) : undefined
      }
      contentContainerStyle={isEmpty ? a.flex_grow : undefined}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={actionedSubjectsQuery.isFetchingNextPage}
          hasNextPage={actionedSubjectsQuery.hasNextPage}
          error={cleanError(actionedSubjectsQuery.error)}
          onRetry={actionedSubjectsQuery.fetchNextPage}
        />
      }
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      desktopFixedHeight
      sideBorders={false}
    />
  )
}

function InboxEmptyState({message}: {message: string}) {
  const t = useTheme()

  return (
    <EmptyState
      icon={InboxIcon}
      iconSize="4xl"
      iconColor={t.atoms.text_contrast_medium.color}
      message={message}
      textStyle={[t.atoms.text_contrast_medium, a.font_medium]}
      style={[a.flex_1, a.justify_center]}
    />
  )
}

function getActionedSubjectKey(item: ActionedSubject) {
  if ('did' in item.subject) return item.subject.did
  if ('uri' in item.subject) return item.subject.uri
  return `${item.src}:${item.latestAction?.id ?? item.createdAt}`
}

function getKnownAccountStanding(standing?: string) {
  switch (standing) {
    case 'good':
    case 'warning':
    case 'atRisk':
      return standing
    default:
      return undefined
  }
}
