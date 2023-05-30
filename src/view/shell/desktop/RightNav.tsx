import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {FEEDBACK_FORM_URL} from 'lib/constants'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {pluralize} from 'lib/strings/helpers'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {MoonIcon, SunIcon} from 'lib/icons'
import {formatCount} from 'view/com/util/numeric/format'

export const DesktopRightNav = observer(function DesktopRightNav() {
  const store = useStores()
  const pal = usePalette('default')
  const mode = useColorSchemeStyle('Light', 'Dark')
  const otherMode = mode === 'Dark' ? 'Light' : 'Dark'

  const onDarkmodePress = React.useCallback(() => {
    store.shell.setDarkMode(!store.shell.darkMode)
  }, [store])

  return (
    <View style={[styles.rightNav, pal.view]}>
      {store.session.hasSession && <DesktopSearch />}
      <View style={styles.message}>
        <Text type="md" style={[pal.textLight, styles.messageLine]}>
          Welcome to Bluesky! This is a beta application that's still in
          development.
        </Text>
        <View style={[s.flexRow]}>
          <TextLink
            type="md"
            style={pal.link}
            href={FEEDBACK_FORM_URL}
            text="Send feedback"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="/support/privacy"
            text="Privacy Policy"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="/support/tos"
            text="Terms"
          />
        </View>
      </View>
      {store.session.hasSession && <InviteCodes />}
      <View>
        <TouchableOpacity
          style={[styles.darkModeToggle]}
          onPress={onDarkmodePress}
          accessibilityRole="button"
          accessibilityLabel="Toggle dark mode"
          accessibilityHint={
            mode === 'Dark'
              ? 'Sets display to light mode'
              : 'Sets display to dark mode'
          }>
          <View style={[pal.viewLight, styles.darkModeToggleIcon]}>
            {mode === 'Dark' ? (
              <SunIcon size={18} style={pal.textLight} />
            ) : (
              <MoonIcon size={18} style={pal.textLight} />
            )}
          </View>
          <Text type="sm" style={pal.textLight}>
            {otherMode} mode
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const InviteCodes = observer(() => {
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
    left: 'calc(50vw + 330px)',
    width: 300,
  },

  message: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  messageLine: {
    marginBottom: 10,
  },

  inviteCodes: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCodesIcon: {
    marginRight: 6,
  },

  darkModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
  },
  darkModeToggleIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 15,
  },
})
