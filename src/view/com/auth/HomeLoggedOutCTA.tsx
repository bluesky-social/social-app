import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'
import {ScrollView} from '../util/Views'
import {Text} from '../util/text/Text'
import {usePalette} from '#/lib/hooks/usePalette'
import {colors, s} from '#/lib/styles'
import {TextLink} from '../util/Link'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'

export function HomeLoggedOutCTA() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const showCreateAccount = React.useCallback(() => {
    requestSwitchToAccount({requestedAccount: 'new'})
  }, [requestSwitchToAccount])

  const showSignIn = React.useCallback(() => {
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount])

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.hero, isMobile && styles.heroMobile]}>
        <Text style={[styles.title, pal.link]}>
          <Trans>Bluesky</Trans>
        </Text>
        <Text
          style={[
            styles.subtitle,
            isMobile && styles.subtitleMobile,
            pal.textLight,
          ]}>
          <Trans>See what's next</Trans>
        </Text>
      </View>
      <View
        testID="signinOrCreateAccount"
        style={isMobile ? undefined : styles.btnsDesktop}>
        <TouchableOpacity
          testID="createAccountButton"
          style={[
            styles.btn,
            isMobile && styles.btnMobile,
            {backgroundColor: colors.blue3},
          ]}
          onPress={showCreateAccount}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Create new account`)}
          accessibilityHint="Opens flow to create a new Bluesky account">
          <Text
            style={[
              s.white,
              styles.btnLabel,
              isMobile && styles.btnLabelMobile,
            ]}>
            <Trans>Create a new account</Trans>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="signInButton"
          style={[styles.btn, isMobile && styles.btnMobile, pal.btn]}
          onPress={showSignIn}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Sign in`)}
          accessibilityHint="Opens flow to sign into your existing Bluesky account">
          <Text
            style={[
              pal.text,
              styles.btnLabel,
              isMobile && styles.btnLabelMobile,
            ]}>
            <Trans>Sign In</Trans>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, pal.view, pal.border]}>
        <TextLink
          type="2xl"
          href="https://blueskyweb.xyz"
          text={_(msg`Business`)}
          style={[styles.footerLink, pal.link]}
        />
        <TextLink
          type="2xl"
          href="https://blueskyweb.xyz/blog"
          text={_(msg`Blog`)}
          style={[styles.footerLink, pal.link]}
        />
        <TextLink
          type="2xl"
          href="https://blueskyweb.xyz/join"
          text={_(msg`Jobs`)}
          style={[styles.footerLink, pal.link]}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  hero: {
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 30,
  },
  heroMobile: {
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    fontSize: 68,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
  },
  subtitleMobile: {
    fontSize: 42,
  },
  btnsDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginHorizontal: 20,
  },
  btn: {
    borderRadius: 32,
    width: 230,
    paddingVertical: 12,
    marginBottom: 20,
  },
  btnMobile: {
    flex: 1,
    width: 'auto',
    marginHorizontal: 20,
    paddingVertical: 16,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 18,
  },
  btnLabelMobile: {
    textAlign: 'center',
    fontSize: 21,
  },

  footer: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  footerLink: {},
})
