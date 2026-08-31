import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {ReportRow} from './components/ReportRow'

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

  // TODO Placeholders. - dsb
  const account = '@deleteme01.bsky.social'
  const list = 'The Worst Posters'

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
      <ReportRow
        subject={l({
          context: 'moderation-report-subject',
          message: `Post by ${account}`,
        })}
        action={l`Awaiting review`}
        date={new Date()}
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-subject',
          message: `List “${list}”`,
        })}
        action={l`No action taken`}
        date={new Date()}
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-subject',
          message: `Direct message from ${account}`,
        })}
        action={l`Message deleted`}
        date={new Date()}
      />
    </Layout.Center>
  )
}

function YourAccount() {
  const {t: l} = useLingui()

  // TODO Placeholders. - dsb
  const guideline = l({
    context: 'moderation-report-guideline',
    message: 'Harassment',
  })
  const label = l({
    context: 'moderation-report-label',
    message: 'Graphic media',
  })
  const duration = plural(72, {
    one: '# hour',
    other: '# hours',
  })

  return (
    <Layout.Center>
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `Your post was removed`,
        })}
        action={l`Violates community guideline: ${guideline}`}
        date={new Date()}
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `A label was added to your post`,
        })}
        action={l`“${label}” – shown behind a warning`}
        date={new Date()}
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `A label was added to your post`,
        })}
        action={l`Ban evasion – ${duration}, now expired`}
        date={new Date()}
      />
    </Layout.Center>
  )
}
