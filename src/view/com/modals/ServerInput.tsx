import React, {useState} from 'react'
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ScrollView, TextInput} from './util'
import {Text} from '../util/text/Text'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {LOCAL_DEV_SERVICE, STAGING_SERVICE, PROD_SERVICE} from 'lib/constants'
import {LOGIN_INCLUDE_DEV_SERVERS} from 'lib/build-flags'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'

export const snapPoints = ['80%']

export function Component({onSelect}: {onSelect: (url: string) => void}) {
  const theme = useTheme()
  const pal = usePalette('default')
  const [customUrl, setCustomUrl] = useState<string>('')
  const {_} = useLingui()
  const {closeModal} = useModalControls()

  const doSelect = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    closeModal()
    onSelect(url)
  }

  return (
    <View style={[pal.view, s.flex1]} testID="serverInputModal">
      <Text type="2xl-bold" style={[pal.text, s.textCenter]}>
        <Trans>Choose Service</Trans>
      </Text>
      <ScrollView style={styles.inner}>
        <View style={styles.group}>
          {LOGIN_INCLUDE_DEV_SERVERS ? (
            <>
              <TouchableOpacity
                testID="localDevServerButton"
                style={styles.btn}
                onPress={() => doSelect(LOCAL_DEV_SERVICE)}
                accessibilityRole="button">
                <Text style={styles.btnText}>
                  <Trans>Local dev server</Trans>
                </Text>
                <FontAwesomeIcon
                  icon="arrow-right"
                  style={s.white as FontAwesomeIconStyle}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => doSelect(STAGING_SERVICE)}
                accessibilityRole="button">
                <Text style={styles.btnText}>
                  <Trans>Staging</Trans>
                </Text>
                <FontAwesomeIcon
                  icon="arrow-right"
                  style={s.white as FontAwesomeIconStyle}
                />
              </TouchableOpacity>
            </>
          ) : undefined}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => doSelect(PROD_SERVICE)}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Select Bluesky Social`)}
            accessibilityHint="Sets Bluesky Social as your service provider">
            <Text style={styles.btnText}>
              <Trans>Bluesky.Social</Trans>
            </Text>
            <FontAwesomeIcon
              icon="arrow-right"
              style={s.white as FontAwesomeIconStyle}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.group}>
          <Text style={[pal.text, styles.label]}>
            <Trans>Other service</Trans>
          </Text>
          <View style={s.flexRow}>
            <TextInput
              testID="customServerTextInput"
              style={[pal.borderDark, pal.text, styles.textInput]}
              placeholder="e.g. https://bsky.app"
              placeholderTextColor={colors.gray4}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              keyboardAppearance={theme.colorScheme}
              value={customUrl}
              onChangeText={setCustomUrl}
              accessibilityLabel={_(msg`Custom domain`)}
              // TODO: Simplify this wording further to be understandable by everyone
              accessibilityHint={_(
                msg`Use your domain as your Bluesky client service provider`,
              )}
            />
            <TouchableOpacity
              testID="customServerSelectBtn"
              style={[pal.borderDark, pal.text, styles.textInputBtn]}
              onPress={() => doSelect(customUrl)}
              accessibilityRole="button"
              accessibilityLabel={`Confirm service. ${
                customUrl === ''
                  ? _(msg`Button disabled. Input custom domain to proceed.`)
                  : ''
              }`}
              accessibilityHint=""
              // TODO - accessibility: Need to inform state change on failure
              disabled={customUrl === ''}>
              <FontAwesomeIcon
                icon="check"
                style={[pal.text as FontAwesomeIconStyle, styles.checkIcon]}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textInputBtn: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue3,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  btnText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: colors.white,
  },
  checkIcon: {
    position: 'relative',
    ...Platform.select({
      android: {
        top: 8,
      },
      ios: {
        top: 2,
      },
    }),
  },
})
