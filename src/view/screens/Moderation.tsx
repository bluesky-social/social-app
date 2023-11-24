import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {CenteredView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSetMinimalShellMode} from '#/state/shell'
import {useModalControls} from '#/state/modals'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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
    </CenteredView>
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
})
