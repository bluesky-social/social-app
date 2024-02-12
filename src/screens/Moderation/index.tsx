import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {NativeStackScreenProps, CommonNavigatorParams} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {CenteredView} from '#/view/com/util/Views'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {Link, TextLink} from '#/view/com/util/Link'
import {Text as OldText} from '#/view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSetMinimalShellMode} from '#/state/shell'
import {useModalControls} from '#/state/modals'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
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
          href="/moderation/modlists">
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
          href="/moderation/muted-accounts">
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
          href="/moderation/blocked-accounts">
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
  const pal = usePalette('default')
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
    <View style={[pal.view, styles.toggleCard]}>
      <View
        style={{flexDirection: 'row', alignItems: 'center', paddingRight: 14}}>
        <ToggleButton
          type="default-light"
          label={_(
            msg`Discourage apps from showing my account to logged-out users`,
          )}
          labelType="lg"
          isSelected={isOptedOut}
          onPress={canToggle ? onToggleOptOut : undefined}
          style={[canToggle ? undefined : {opacity: 0.5}, {flex: 1}]}
        />
        {updateProfile.isPending && <ActivityIndicator />}
      </View>
      <View
        style={{
          flexDirection: 'column',
          gap: 10,
          paddingLeft: 66,
          paddingRight: 12,
          paddingBottom: 10,
          marginBottom: 64,
        }}>
        <OldText style={pal.textLight}>
          <Trans>
            Bluesky will not show your profile and posts to logged-out users.
            Other apps may not honor this request. This does not make your
            account private.
          </Trans>
        </OldText>
        <OldText style={[pal.textLight, {fontWeight: '500'}]}>
          <Trans>
            Note: Bluesky is an open and public network. This setting only
            limits the visibility of your content on the Bluesky app and
            website, and other apps may not respect this setting. Your content
            may still be shown to logged-out users by other apps and websites.
          </Trans>
        </OldText>
        <TextLink
          style={pal.link}
          href="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy"
          text={_(msg`Learn more about what is public on Bluesky.`)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  spacer: {
    height: 6,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  toggleCard: {
    paddingVertical: 8,
    paddingTop: 2,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  noBorder: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
})
