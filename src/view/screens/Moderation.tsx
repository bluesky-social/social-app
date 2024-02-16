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
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {CenteredView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link, TextLink} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSetMinimalShellMode} from '#/state/shell'
import {useModalControls} from '#/state/modals'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ToggleButton} from '../com/util/forms/ToggleButton'
import {useSession} from '#/state/session'
import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import {ScrollView} from '../com/util/Views'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Moderation'>
export function ModerationScreen({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen, track} = useAnalytics()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {openModal} = useModalControls()

  useFocusEffect(
    React.useCallback(() => {
      screen('Moderation')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  const onPressContentFiltering = React.useCallback(() => {
    track('Moderation:ContentfilteringButtonClicked')
    openModal({name: 'content-filtering-settings'})
  }, [track, openModal])

  return (
    <CenteredView
      style={[
        s.hContentRegion,
        pal.border,
        isTabletOrDesktop ? styles.desktopContainer : pal.viewLight,
      ]}
      testID="moderationScreen">
      <ViewHeader title={_(msg`Moderation`)} showOnDesktop />
      <ScrollView contentContainerStyle={[styles.noBorder]}>
        <View style={styles.spacer} />
        <TouchableOpacity
          testID="contentFilteringBtn"
          style={[styles.linkCard, pal.view]}
          onPress={onPressContentFiltering}
          accessibilityRole="tab"
          accessibilityLabel={_(msg`Content filtering`)}
          accessibilityHint={_(
            msg`Opens modal for content filtering preferences`,
          )}>
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="eye"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Content filtering</Trans>
          </Text>
        </TouchableOpacity>
        <Link
          testID="moderationlistsBtn"
          style={[styles.linkCard, pal.view]}
          href="/moderation/modlists">
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="users-slash"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Moderation lists</Trans>
          </Text>
        </Link>
        <Link
          testID="mutedAccountsBtn"
          style={[styles.linkCard, pal.view]}
          href="/moderation/muted-accounts">
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="user-slash"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Muted accounts</Trans>
          </Text>
        </Link>
        <Link
          testID="blockedAccountsBtn"
          style={[styles.linkCard, pal.view]}
          href="/moderation/blocked-accounts">
          <View style={[styles.iconContainer, pal.btn]}>
            <FontAwesomeIcon
              icon="ban"
              style={pal.text as FontAwesomeIconStyle}
            />
          </View>
          <Text type="lg" style={pal.text}>
            <Trans>Blocked accounts</Trans>
          </Text>
        </Link>
        <Text
          type="xl-bold"
          style={[
            pal.text,
            {
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 6,
            },
          ]}>
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
        <Text style={pal.textLight}>
          <Trans>
            Bluesky will not show your profile and posts to logged-out users.
            Other apps may not honor this request. This does not make your
            account private.
          </Trans>
        </Text>
        <Text style={[pal.textLight, {fontWeight: '500'}]}>
          <Trans>
            Note: Bluesky is an open and public network. This setting only
            limits the visibility of your content on the Bluesky app and
            website, and other apps may not respect this setting. Your content
            may still be shown to logged-out users by other apps and websites.
          </Trans>
        </Text>
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
