import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {StatusTag} from './components/StatusTag'

type ReportFilter = 'all' | 'pending' | 'resolved' | 'unread'

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
              <Layout.Header.Slot />
            </Layout.Header.Outer>
            <TabBar
              testID="moderationInboxTabs"
              items={[l`Your reports`, l`Actions on you`]}
              align="left"
              {...props}
            />
          </Layout.Center>
        )}>
        <YourReports />
        <ActionsOnYou />
      </Pager>
    </Layout.Screen>
  )
}

function YourReports() {
  const t = useTheme()
  const {t: l} = useLingui()
  const [filter, setFilter] = useState<ReportFilter>('all')

  const hasUnread = true // TODO This is hard-coded atm. -dsb

  const labels: Record<ReportFilter, string> = {
    all: l({context: 'moderation-report-filter', message: 'All'}),
    pending: l({
      context: 'moderation-report-filter',
      message: 'Under review',
    }),
    resolved: l({context: 'moderation-report-filter', message: 'Resolved'}),
    unread: l({context: 'moderation-report-filter', message: 'Unread'}),
  }
  const options: {value: ReportFilter; label: string}[] = [
    {value: 'all', label: labels.all},
    {value: 'pending', label: labels.pending},
    {value: 'resolved', label: labels.resolved},
    {value: 'unread', label: labels.unread},
  ]
  const currentLabel = labels[filter]

  return (
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
        <Menu.Root>
          <Menu.Trigger
            label={l`Filter moderation reports (currently: ${currentLabel})`}>
            {({props}) => (
              <Pressable
                {...props}
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_center,
                  a.gap_xs,
                ]}>
                <Text style={[a.text_md, a.font_medium]}>{currentLabel}</Text>
                <ChevronDownIcon size="xs" style={[t.atoms.text]} />
              </Pressable>
            )}
          </Menu.Trigger>
          <Menu.Outer>
            <Menu.Group>
              {options.map(option => (
                <Menu.Item
                  key={option.value}
                  label={option.label}
                  onPress={() => setFilter(option.value)}>
                  <Menu.ItemText>{option.label}</Menu.ItemText>
                  <Menu.ItemRadio selected={filter === option.value} />
                </Menu.Item>
              ))}
            </Menu.Group>
          </Menu.Outer>
        </Menu.Root>
        {hasUnread ? (
          <SimpleInlineLinkText
            label={l`Mark all reports as read`}
            style={[a.text_md, t.atoms.text]}
            {...createStaticClick(() => {
              // TODO Handle this action. -dsb
            })}>
            <Trans>Mark all as read</Trans>
          </SimpleInlineLinkText>
        ) : undefined}
      </View>
      <ReportRow status="resolved" unread />
      <ReportRow unread />
      <ReportRow />
    </Layout.Center>
  )
}

function ReportRow({
  status,
  unread,
}: {
  status?: 'resolved' | 'pending'
  unread?: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const shouldShowYear = false // TODO Check for within last year. -dsb

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_sm,
        a.p_lg,
        {
          backgroundColor: unread ? t.palette.primary_25 : undefined,
        },
      ]}>
      <View style={[a.gap_2xs]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          Post by @deleteme01.bsky.social
        </Text>
        <Text style={[a.text_sm, {color: t.palette.primary_900}]}>
          Post removed
        </Text>
        <View style={[a.mt_2xs, a.flex_row, a.align_center, a.gap_sm]}>
          <StatusTag status={status} />
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {i18n.date(new Date(), {
              month: 'short',
              day: 'numeric',
              year: shouldShowYear ? 'numeric' : undefined,
            })}
          </Text>
        </View>
      </View>
      <View style={[a.flex_row, a.align_center, a.justify_center, a.gap_sm]}>
        {unread ? (
          <View
            style={[
              a.rounded_full,
              {height: 8, width: 8, backgroundColor: t.palette.primary_500},
            ]}
          />
        ) : null}
        <ChevronRightIcon size="md" style={[t.atoms.text_contrast_medium]} />
      </View>
    </View>
  )
}

function ActionsOnYou() {
  return (
    <Layout.Center style={[a.flex_1, a.align_center, a.justify_center]}>
      <Text>TODO</Text>
    </Layout.Center>
  )
}
