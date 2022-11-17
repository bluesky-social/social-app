import React, {useState, useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {FAB} from '../com/util/FloatingActionButton'
import {Feed} from '../com/notifications/Feed'
import {useStores} from '../../state'
import {NotificationsViewModel} from '../../state/models/notifications-view'
import {ScreenParams} from '../routes'

export const Notifications = ({navIdx, visible}: ScreenParams) => {
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
    store.me.refreshMemberships() // needed for the invite notifications
    if (hasSetup) {
      console.log('Updating notifications feed')
      notesView?.update()
    } else {
      store.nav.setTitle(navIdx, 'Notifications')
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

  const onComposePress = () => {
    store.shell.openComposer({})
  }
  const onPressTryAgain = () => {
    notesView?.refresh()
  }

  return (
    <View style={{flex: 1}}>
      <ViewHeader title="Notifications" />
      {notesView && <Feed view={notesView} onPressTryAgain={onPressTryAgain} />}
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
}
