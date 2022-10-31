import React, {useState, useEffect} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Feed} from '../com/notifications/Feed'
import {colors} from '../lib/styles'
import {useStores} from '../../state'
import {NotificationsViewModel} from '../../state/models/notifications-view'
import {ScreenParams} from '../routes'

export const Notifications = ({visible}: ScreenParams) => {
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [notesView, setNotesView] = useState<
    NotificationsViewModel | undefined
  >()
  const store = useStores()

  useEffect(() => {
    let aborted = false
    if (!visible) {
      return
    }
    if (hasSetup) {
      console.log('Updating notifications feed')
      notesView?.update()
    } else {
      store.nav.setTitle('Notifications')
      console.log('Fetching notifications feed')
      const newNotesView = new NotificationsViewModel(store, {})
      setNotesView(newNotesView)
      newNotesView.setup().then(() => {
        if (aborted) return
        setHasSetup(true)
      })
    }
    return () => {
      aborted = true
    }
  }, [visible, store])

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {notesView && <Feed view={notesView} />}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
})
