import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Text} from '../com/util/text/Text'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Button} from 'view/com/util/forms/Button'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from 'lib/analytics/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {LANGUAGES} from 'lib/../locale/languages'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LanguageSettings'>

export const LanguageSettingsScreen = observer(function LanguageSettingsImpl(
  _: Props,
) {
  const pal = usePalette('default')
  const store = useStores()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {screen, track} = useAnalytics()

  useFocusEffect(
    React.useCallback(() => {
      screen('Settings')
      store.shell.setMinimalShellMode(false)
    }, [screen, store]),
  )

  const onPressContentLanguages = React.useCallback(() => {
    track('Settings:ContentlanguagesButtonClicked')
    store.shell.openModal({name: 'content-languages-settings'})
  }, [track, store])

  const myLanguages = React.useMemo(() => {
    return (
      store.preferences.contentLanguages
        .map(lang => LANGUAGES.find(l => l.code2 === lang))
        .filter(Boolean)
        // @ts-ignore
        .map(l => l.name)
        .join(', ')
    )
  }, [store.preferences.contentLanguages])

  return (
    <CenteredView
      style={[
        pal.view,
        pal.border,
        styles.container,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title="Language Settings" showOnDesktop />

      <View style={{paddingTop: 20, paddingHorizontal: 20}}>
        <View style={{paddingBottom: 20}}>
          <Text type="title-sm" style={[pal.text, s.pb5]}>
            Primary Language
          </Text>
          <Text style={[pal.text, s.pb10]}>
            Your preferred language for translating posts in your feeds.
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: pal.border.borderColor,
            marginBottom: 20,
          }}
        />

        <View style={{paddingBottom: 20}}>
          <Text type="title-sm" style={[pal.text, s.pb5]}>
            Content Languages
          </Text>
          <Text style={[pal.text, s.pb10]}>
            Select the languages of content you'd like to see in your feeds.
          </Text>
          <Text style={[pal.textLight, s.pb20]}>
            Your languages:{' '}
            {myLanguages.length ? myLanguages : '(none selected)'}
          </Text>

          <Button
            type="default"
            onPress={onPressContentLanguages}
            style={styles.button}>
            <FontAwesomeIcon
              icon="plus"
              style={pal.text as FontAwesomeIconStyle}
            />
            <Text type="button" style={pal.text}>
              Select Languages
            </Text>
          </Button>
        </View>
      </View>
    </CenteredView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 90,
  },
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
