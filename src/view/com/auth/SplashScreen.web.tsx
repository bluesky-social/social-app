import React from 'react'
import {StyleSheet, TouchableOpacity, View, Pressable} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from '../util/Link'
import {ErrorBoundary} from 'view/com/util/ErrorBoundary'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {CenteredView} from '../util/Views'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Trans} from '@lingui/macro'
import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'

export const SplashScreen = ({
  onDismiss,
  onPressSignin,
  onPressCreateAccount,
}: {
  onDismiss?: () => void
  onPressSignin: () => void
  onPressCreateAccount: () => void
}) => {
  const pal = usePalette('default')
  const {isTabletOrMobile} = useWebMediaQueries()
  const styles = useStyles()
  const isMobileWeb = isWeb && isTabletOrMobile

  return (
    <>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: 20,
            zIndex: 100,
          }}
          onPress={onDismiss}>
          <FontAwesomeIcon
            icon="x"
            size={24}
            style={{
              color: String(pal.text.color),
            }}
          />
        </Pressable>
      )}

      <CenteredView style={[styles.container, pal.view]}>
        <View
          testID="noSessionView"
          style={[
            styles.containerInner,
            isMobileWeb && styles.containerInnerMobile,
            pal.border,
            {alignItems: 'center'},
          ]}>
          <ErrorBoundary>
            <Logo width={92} fill="sky" />

            <View style={{paddingTop: 40, paddingBottom: 20}}>
              <Logotype width={161} fill={pal.text.color} />
            </View>

            <View testID="signinOrCreateAccount" style={styles.btns}>
              <TouchableOpacity
                testID="createAccountButton"
                style={[styles.btn, {backgroundColor: colors.blue3}]}
                onPress={onPressCreateAccount}
                // TODO: web accessibility
                accessibilityRole="button">
                <Text style={[s.white, styles.btnLabel]}>
                  <Trans>Create a new account</Trans>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="signInButton"
                style={[styles.btn, pal.btn]}
                onPress={onPressSignin}
                // TODO: web accessibility
                accessibilityRole="button">
                <Text style={[pal.text, styles.btnLabel]}>
                  <Trans>Sign In</Trans>
                </Text>
              </TouchableOpacity>
            </View>
          </ErrorBoundary>
        </View>
        <Footer styles={styles} />
      </CenteredView>
    </>
  )
}

function Footer({styles}: {styles: ReturnType<typeof useStyles>}) {
  const pal = usePalette('default')

  return (
    <View style={[styles.footer, pal.view, pal.border]}>
      <TextLink
        href="https://bsky.social"
        text="Business"
        style={[styles.footerLink, pal.link]}
      />
      <TextLink
        href="https://bsky.social/about/blog"
        text="Blog"
        style={[styles.footerLink, pal.link]}
      />
      <TextLink
        href="https://bsky.social/about/join"
        text="Jobs"
        style={[styles.footerLink, pal.link]}
      />
    </View>
  )
}
const useStyles = () => {
  return StyleSheet.create({
    container: {
      height: '100%',
    },
    containerInner: {
      height: '100%',
      justifyContent: 'center',
      // @ts-ignore web only
      paddingBottom: '20vh',
      paddingHorizontal: 20,
    },
    containerInnerMobile: {
      paddingBottom: 50,
    },
    title: {
      textAlign: 'center',
      color: colors.blue3,
      fontSize: 68,
      fontWeight: 'bold',
      paddingBottom: 10,
    },
    titleMobile: {
      textAlign: 'center',
      color: colors.blue3,
      fontSize: 58,
      fontWeight: 'bold',
    },
    subtitle: {
      textAlign: 'center',
      color: colors.gray5,
      fontSize: 52,
      fontWeight: 'bold',
      paddingBottom: 30,
    },
    subtitleMobile: {
      textAlign: 'center',
      color: colors.gray5,
      fontSize: 42,
      fontWeight: 'bold',
      paddingBottom: 30,
    },
    btns: {
      gap: 10,
      justifyContent: 'center',
      paddingBottom: 40,
    },
    btn: {
      borderRadius: 30,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 220,
    },
    btnLabel: {
      textAlign: 'center',
      fontSize: 18,
    },
    notice: {
      paddingHorizontal: 40,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 20,
      borderTopWidth: 1,
      flexDirection: 'row',
    },
    footerLink: {
      marginRight: 20,
    },
  })
}
