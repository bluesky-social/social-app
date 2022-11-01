import React, {useState, useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Feed} from '../com/notifications/Feed'
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
      <ViewHeader title="Notifications" />
      {notesView && <Feed view={notesView} />}
    </View>
  )
}
