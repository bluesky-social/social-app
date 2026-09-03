import {useState} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {createStaticClick, Link, SimpleInlineLinkText} from '#/components/Link'
import {useAnalytics} from '#/analytics'
import {AccountStatus} from './components/AccountStatus'
import {FilterMenu} from './components/FilterMenu'
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

  const [filter, setFilter] = useState<ReportFilter>('all')

  const hasUnread = true // TODO This is hard-coded atm. -dsb

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
        <FilterMenu filter={filter} setFilter={setFilter} />
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
        to="/moderation/inbox/report/details"
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-subject',
          message: `List “${list}”`,
        })}
        action={l`No action taken`}
        date={new Date()}
        to="/moderation/inbox/report/details"
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-subject',
          message: `Direct message from ${account}`,
        })}
        action={l`Message deleted`}
        date={new Date()}
        to="/moderation/inbox/report/details"
      />
    </Layout.Center>
  )
}

function YourAccount() {
  const t = useTheme()
  const {t: l} = useLingui()

  const [filter, setFilter] = useState<ReportFilter>('all')

  const hasUnread = true // TODO This is hard-coded atm. -dsb

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
              // TODO Handle this action. -dsb
            })}>
            <Trans>Mark all as read</Trans>
          </SimpleInlineLinkText>
        ) : undefined}
      </View>
      <AccountStatus status="warning" />
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `Your post was removed`,
        })}
        action={l`Violates community guideline: ${guideline}`}
        date={new Date()}
        to="/moderation/inbox/subject/details"
        unread
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `A label was added to your post`,
        })}
        action={l`“${label}” – shown behind a warning`}
        date={new Date()}
        to="/moderation/inbox/subject/details"
      />
      <ReportRow
        subject={l({
          context: 'moderation-report-action',
          message: `Your account was suspended`,
        })}
        action={l`Ban evasion – ${duration}, now expired`}
        date={new Date()}
        to="/moderation/inbox/subject/details"
      />
    </Layout.Center>
  )
}
