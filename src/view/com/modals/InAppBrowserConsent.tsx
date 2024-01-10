import React from 'react'
import {StyleSheet, View} from 'react-native'

import {s} from 'lib/styles'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {ScrollView} from './util'
import {usePalette} from 'lib/hooks/usePalette'

import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {
  useOpenLink,
  useSetInAppBrowser,
} from '#/state/preferences/in-app-browser'

export const snapPoints = [350]

export function Component({href}: {href: string}) {
  const pal = usePalette('default')
  const {closeModal} = useModalControls()
  const {_} = useLingui()
  const setInAppBrowser = useSetInAppBrowser()
  const openLink = useOpenLink()

  const onUseIAB = React.useCallback(() => {
    setInAppBrowser(true)
    closeModal()
    openLink(href, true)
  }, [closeModal, setInAppBrowser, href, openLink])

  const onUseLinking = React.useCallback(() => {
    setInAppBrowser(false)
    closeModal()
    openLink(href, false)
  }, [closeModal, setInAppBrowser, href, openLink])

  return (
    <ScrollView
      testID="inAppBrowserConsentModal"
      style={[s.flex1, pal.view, {paddingHorizontal: 20, paddingTop: 10}]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>How should we open this link?</Trans>
      </Text>
      <Text style={pal.text}>
        <Trans>
          Your choice will be saved, but can be changed later in settings
        </Trans>
      </Text>
      <View style={[styles.btnContainer]}>
        <Button
          testID="confirmBtn"
          type="primary"
          onPress={onUseIAB}
          accessibilityLabel={_(msg`Use in-app browser`)}
          accessibilityHint=""
          label={_(msg`Use in-app browser`)}
          labelContainerStyle={{justifyContent: 'center', padding: 4}}
          labelStyle={[s.f18]}
        />
        <Button
          testID="confirmBtn"
          type="primary"
          onPress={onUseLinking}
          accessibilityLabel={_(msg`Use my default browser`)}
          accessibilityHint=""
          label={_(msg`Use my default browser`)}
          labelContainerStyle={{justifyContent: 'center', padding: 4}}
          labelStyle={[s.f18]}
        />
        <Button
          testID="cancelBtn"
          type="default"
          onPress={() => {
            closeModal()
          }}
          accessibilityLabel={_(msg`Cancel`)}
          accessibilityHint=""
          label="Cancel"
          labelContainerStyle={{justifyContent: 'center', padding: 4}}
          labelStyle={[s.f18]}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  btnContainer: {
    marginTop: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    rowGap: 10,
  },
})
