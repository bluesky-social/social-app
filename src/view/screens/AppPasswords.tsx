import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ScrollView} from 'react-native-gesture-handler'
import {Text} from '../com/util/text/Text'
import {Button} from '../com/util/forms/Button'
import * as Toast from '../com/util/Toast'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useAnalytics} from 'lib/analytics/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppPasswords'>
export const AppPasswords = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const {screen} = useAnalytics()

    useFocusEffect(
      React.useCallback(() => {
        screen('AppPasswords')
        store.shell.setMinimalShellMode(false)
      }, [screen, store]),
    )

    const onAdd = React.useCallback(async () => {
      store.shell.openModal({name: 'add-app-password'})
    }, [store])

    // no app passwords (empty) state
    if (store.me.appPasswords.length === 0) {
      return (
        <CenteredView
          style={[
            styles.container,
            isDesktopWeb && styles.containerDesktop,
            pal.view,
            pal.border,
          ]}
          testID="appPasswordsScreen">
          <AppPasswordsHeader />
          <View style={[styles.empty, pal.viewLight]}>
            <Text type="lg" style={[pal.text, styles.emptyText]}>
              You have not created any app passwords yet. You can create one by
              pressing the button below.
            </Text>
          </View>
          {!isDesktopWeb && <View style={styles.flex1} />}
          <View
            style={[
              styles.btnContainer,
              isDesktopWeb && styles.btnContainerDesktop,
            ]}>
            <Button
              testID="appPasswordBtn"
              type="primary"
              label="Add App Password"
              style={styles.btn}
              labelStyle={styles.btnLabel}
              onPress={onAdd}
            />
          </View>
        </CenteredView>
      )
    }

    // has app passwords
    return (
      <CenteredView
        style={[
          styles.container,
          isDesktopWeb && styles.containerDesktop,
          pal.view,
          pal.border,
        ]}
        testID="appPasswordsScreen">
        <AppPasswordsHeader />
        <ScrollView
          style={[
            styles.scrollContainer,
            pal.border,
            !isDesktopWeb && styles.flex1,
          ]}>
          {store.me.appPasswords.map((password, i) => (
            <AppPassword
              key={password.name}
              testID={`appPassword-${i}`}
              name={password.name}
              createdAt={password.createdAt}
            />
          ))}
          {isDesktopWeb && (
            <View style={[styles.btnContainer, styles.btnContainerDesktop]}>
              <Button
                testID="appPasswordBtn"
                type="primary"
                label="Add App Password"
                style={styles.btn}
                labelStyle={styles.btnLabel}
                onPress={onAdd}
              />
            </View>
          )}
        </ScrollView>
        {!isDesktopWeb && (
          <View style={styles.btnContainer}>
            <Button
              testID="appPasswordBtn"
              type="primary"
              label="Add App Password"
              style={styles.btn}
              labelStyle={styles.btnLabel}
              onPress={onAdd}
            />
          </View>
        )}
      </CenteredView>
    )
  }),
)

function AppPasswordsHeader() {
  const pal = usePalette('default')
  return (
    <>
      <ViewHeader title="App Passwords" showOnDesktop />
      <Text
        type="sm"
        style={[
          styles.description,
          pal.text,
          isDesktopWeb && styles.descriptionDesktop,
        ]}>
        Use app passwords to login to other Bluesky clients without giving full
        access to your account or password.
      </Text>
    </>
  )
}

function AppPassword({
  testID,
  name,
  createdAt,
}: {
  testID: string
  name: string
  createdAt: string
}) {
  const pal = usePalette('default')
  const store = useStores()

  const onDelete = React.useCallback(async () => {
    store.shell.openModal({
      name: 'confirm',
      title: 'Delete App Password',
      message: `Are you sure you want to delete the app password "${name}"?`,
      async onPressConfirm() {
        await store.me.deleteAppPassword(name)
        Toast.show('App password deleted')
      },
    })
  }, [store, name])

  const {contentLanguages} = store.preferences

  const primaryLocale =
    contentLanguages.length > 0 ? contentLanguages[0] : 'en-US'

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.item, pal.border]}
      onPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel="Delete app password"
      accessibilityHint="">
      <View>
        <Text type="md-bold" style={pal.text}>
          {name}
        </Text>
        <Text type="md" style={[pal.text, styles.pr10]} numberOfLines={1}>
          Created{' '}
          {Intl.DateTimeFormat(primaryLocale, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date(createdAt))}
        </Text>
      </View>
      <FontAwesomeIcon icon={['far', 'trash-can']} style={styles.trashIcon} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  descriptionDesktop: {
    marginTop: 14,
  },

  scrollContainer: {
    borderTopWidth: 1,
    marginTop: 4,
    marginBottom: 16,
  },

  flex1: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  pr10: {
    marginRight: 10,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnContainerDesktop: {
    marginTop: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    paddingHorizontal: 60,
    paddingVertical: 14,
  },
  btnLabel: {
    fontSize: 18,
  },

  trashIcon: {
    color: 'red',
    minWidth: 16,
  },
})
