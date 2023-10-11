import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'
import {DesktopFeeds} from './Feeds'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from 'lib/constants'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {pluralize} from 'lib/strings/helpers'
import {formatCount} from 'view/com/util/numeric/format'

export const DesktopRightNav = observer(function DesktopRightNavImpl() {
  const store = useStores()
  const pal = usePalette('default')
  const palError = usePalette('error')

  const {isTablet} = useWebMediaQueries()
  if (isTablet) {
    return null
  }

  return (
    <View style={[styles.rightNav, pal.view]}>
      {store.session.hasSession && <DesktopSearch />}
      {store.session.hasSession && <DesktopFeeds />}
      <View style={styles.message}>
        {store.session.isSandbox ? (
          <View style={[palError.view, styles.messageLine, s.p10]}>
            <Text type="md" style={[palError.text, s.bold]}>
              SANDBOX. Posts and accounts are not permanent.
            </Text>
          </View>
        ) : undefined}
        <View style={[s.flexRow]}>
          <TextLink
            type="md"
            style={pal.link}
            href={FEEDBACK_FORM_URL({
              email: store.session.currentSession?.email,
              handle: store.session.currentSession?.handle,
            })}
            text="Send feedback"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="https://blueskyweb.xyz/support/privacy-policy"
            text="Privacy"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="https://blueskyweb.xyz/support/tos"
            text="Terms"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href={HELP_DESK_URL}
            text="Help"
          />
        </View>
      </View>
      <InviteCodes />
    </View>
  )
})

const InviteCodes = observer(function InviteCodesImpl() {
  const store = useStores()
  const pal = usePalette('default')

  const {invitesAvailable} = store.me

  const onPress = React.useCallback(() => {
    store.shell.openModal({name: 'invite-codes'})
  }, [store])
  return (
    <TouchableOpacity
      style={[styles.inviteCodes, pal.border]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        invitesAvailable === 1
          ? 'Invite codes: 1 available'
          : `Invite codes: ${invitesAvailable} available`
      }
      accessibilityHint="Opens list of invite codes">
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          store.me.invitesAvailable > 0 ? pal.link : pal.textLight,
        ]}
        size={16}
      />
      <Text
        type="md-medium"
        style={store.me.invitesAvailable > 0 ? pal.link : pal.textLight}>
        {formatCount(store.me.invitesAvailable)} invite{' '}
        {pluralize(store.me.invitesAvailable, 'code')} available
      </Text>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  rightNav: {
    position: 'absolute',
    top: 20,
    // @ts-ignore web only
    left: 'calc(50vw + 320px)',
    width: 304,
    // @ts-ignore web only
    maxHeight: '90vh',
  },

  message: {
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  messageLine: {
    marginBottom: 10,
  },

  inviteCodes: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCodesIcon: {
    marginRight: 6,
  },
})
