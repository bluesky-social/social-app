import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {NativeStackScreenProps, CommonNavigatorParams} from '#/lib/routes/types'
import {CenteredView} from '#/view/com/util/Views'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {useAnalytics} from 'lib/analytics/analytics'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSession} from '#/state/session'
import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import {ScrollView} from '#/view/com/util/Views'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'
import {InlineLink, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Moderation'>
export function ModerationScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {gtMobile, gtTablet} = useBreakpoints()

  useFocusEffect(
    React.useCallback(() => {
      screen('Moderation')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <CenteredView
      style={[
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        ...(gtMobile ? [a.border_l, a.border_r] : []),
      ]}
      testID="moderationScreen">
      <ViewHeader title={_(msg`Moderation`)} showOnDesktop />

      <ScrollView contentContainerStyle={[a.border_0]}>
        {!gtTablet && <Divider />}

        <Link
          testID="moderationlistsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/modlists">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <Group size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Moderation lists</Trans>
          </Text>
        </Link>

        <Divider />

        <Link
          testID="mutedAccountsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/muted-accounts">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <Person size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Muted accounts</Trans>
          </Text>
        </Link>

        <Divider />

        <Link
          testID="blockedAccountsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/blocked-accounts">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <CircleBanSign size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Blocked accounts</Trans>
          </Text>
        </Link>

        <Divider />

        <Text style={[a.text_lg, a.font_bold, a.pl_lg, a.pt_lg, a.pb_sm]}>
          <Trans>Logged-out visibility</Trans>
        </Text>
        <PwiOptOut />
      </ScrollView>
    </CenteredView>
  )
}

function PwiOptOut() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const updateProfile = useProfileUpdateMutation()

  const isOptedOut =
    profile?.labels?.some(l => l.val === '!no-unauthenticated') || false
  const canToggle = profile && !updateProfile.isPending

  const onToggleOptOut = React.useCallback(() => {
    if (!profile) {
      return
    }
    let wasAdded = false
    updateProfile.mutate({
      profile,
      updates: existing => {
        // create labels attr if needed
        existing.labels = ComAtprotoLabelDefs.isSelfLabels(existing.labels)
          ? existing.labels
          : {
              $type: 'com.atproto.label.defs#selfLabels',
              values: [],
            }

        // toggle the label
        const hasLabel = existing.labels.values.some(
          l => l.val === '!no-unauthenticated',
        )
        if (hasLabel) {
          wasAdded = false
          existing.labels.values = existing.labels.values.filter(
            l => l.val !== '!no-unauthenticated',
          )
        } else {
          wasAdded = true
          existing.labels.values.push({val: '!no-unauthenticated'})
        }

        // delete if no longer needed
        if (existing.labels.values.length === 0) {
          delete existing.labels
        }
        return existing
      },
      checkCommitted: res => {
        const exists = !!res.data.labels?.some(
          l => l.val === '!no-unauthenticated',
        )
        return exists === wasAdded
      },
    })
  }, [updateProfile, profile])

  return (
    <View style={[a.pt_sm, a.px_lg]}>
      <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_lg]}>
        <Toggle.Item
          disabled={!canToggle}
          value={isOptedOut}
          onChange={onToggleOptOut}
          name="logged_out_visibility"
          label={_(
            msg`Discourage apps from showing my account to logged-out users`,
          )}>
          <Toggle.Switch />
          <Toggle.Label style={[a.text_md]}>
            Discourage apps from showing my account to logged-out users
          </Toggle.Label>
        </Toggle.Item>

        {updateProfile.isPending && <Loader />}
      </View>

      <View style={[a.pt_md, a.gap_md, {paddingLeft: 38}]}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            Bluesky will not show your profile and posts to logged-out users.
            Other apps may not honor this request. This does not make your
            account private.
          </Trans>
        </Text>
        <Text style={[a.font_bold, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            Note: Bluesky is an open and public network. This setting only
            limits the visibility of your content on the Bluesky app and
            website, and other apps may not respect this setting. Your content
            may still be shown to logged-out users by other apps and websites.
          </Trans>
        </Text>

        <InlineLink to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy">
          <Trans>Learn more about what is public on Bluesky.</Trans>
        </InlineLink>
      </View>
    </View>
  )
}
