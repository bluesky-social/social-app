import React from 'react'
import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../com/util/text/Text'
import {Button} from '../com/util/forms/Button'
import * as Toast from '../com/util/Toast'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {ScrollView} from 'react-native-gesture-handler'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useAnalytics} from 'lib/analytics'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AppPasswords'>
export const AppPasswords = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const {screen} = useAnalytics()

    useFocusEffect(
      React.useCallback(() => {
        screen('Settings')
        store.shell.setMinimalShellMode(false)
      }, [screen, store]),
    )

    const onAdd = React.useCallback(async () => {
      // const createdPassword = await store.me.createAppPassword('test')
      // console.log(createdPassword)
      store.shell.openModal({name: 'add-app-password'})
    }, [store])

    // no app passwords (empty) state
    if (store.me.appPasswords.length === 0) {
      return (
        <View style={[styles.container, pal.view]} testID="appPasswordsScreen">
          <AppPasswordsHeader />
          <View style={[styles.empty, pal.viewLight]}>
            <Text type="lg" style={[pal.text, styles.emptyText]}>
              You have not created any app passwords yet. You can create one by
              pressing the button below.
            </Text>
          </View>
          <View style={styles.flex1} />
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
        </View>
      )
    }

    // has app passwords
    return (
      <View style={[styles.container, pal.view]} testID="appPasswordsScreen">
        <AppPasswordsHeader />
        <ScrollView style={[styles.scrollContainer, pal.border]}>
          {store.me.appPasswords.map((password, i) => (
            <AppPassword
              key={password.name}
              testID={`appPassword-${i}`}
              name={password.name}
              createdAt={password.createdAt}
            />
          ))}
        </ScrollView>
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
      </View>
    )
  }),
)

function AppPasswordsHeader() {
  const pal = usePalette('default')
  return (
    <>
      <ViewHeader title="App Passwords" />
      <Text type="sm" style={[styles.description, pal.text]}>
        These app passwords can be used to log into Bluesky on other client apps
        without giving them full access to your account or your password.
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
    Alert.alert(
      'Delete App Password',
      `Are you sure you want to delete the app password "${name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await store.me.deleteAppPassword(name)
            Toast.show('App password deleted')
          },
        },
      ],
    )
  }, [store, name])

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.item, pal.border]}
      onPress={onDelete}>
      <Text type={'md-bold'} style={pal.text}>
        {name}
      </Text>
      <Text type={'md'} style={pal.text}>
        {new Date(createdAt).toDateString()}
      </Text>
      <FontAwesomeIcon icon={['far', 'trash-can']} style={styles.trashIcon} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
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

  scrollContainer: {
    flex: 1,
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

  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  },
})
