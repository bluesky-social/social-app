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
      <View style={styles.spacer} />
      <TouchableOpacity
        testID="contentFilteringBtn"
        style={[styles.linkCard, pal.view]}
        onPress={onPressContentFiltering}
        accessibilityRole="tab"
        accessibilityHint="Content filtering"
        accessibilityLabel="">
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
        <Trans>My Account</Trans>
      </Text>
      <PwiOptOut />
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
    updateProfile.mutate({
      profile,
      updates: existing => {
        existing.labels = ComAtprotoLabelDefs.isSelfLabels(existing.labels)
          ? existing.labels
          : {
              $type: 'com.atproto.label.defs#selfLabels',
              values: [],
            }
        const hasLabel = existing.labels.values.some(
          l => l.val === '!no-unauthenticated',
        )
        if (hasLabel) {
          existing.labels.values = existing.labels.values.filter(
            l => l.val !== '!no-unauthenticated',
          )
        } else {
          existing.labels.values.push({val: '!no-unauthenticated'})
        }
        if (existing.labels.values.length === 0) {
          delete existing.labels
        }
        return existing
      },
    })
  }, [updateProfile, profile])

  return (
    <View style={[pal.view, styles.toggleCard]}>
      <View
        style={{flexDirection: 'row', alignItems: 'center', paddingRight: 14}}>
        <ToggleButton
          type="default-light"
          label={_(msg`Request to limit the visibility of my account`)}
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
          paddingRight: 8,
          paddingBottom: 10,
        }}>
        <Text style={pal.textLight}>
          <Trans>
            Your profile and account will not be visible to anyone visiting the
            Bluesky app without an account, or to account holders who are not
            logged in. Enabling this will not make your profile private.
          </Trans>
        </Text>
        <Text style={pal.textLight}>
          <Trans>
            <Text style={[pal.textLight, {fontWeight: '600'}]}>
              Note: This setting may not be respected by third-party apps that
              display Bluesky content.
            </Text>{' '}
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
})
