import React, {useEffect} from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {CardBrowser} from '../browser/CardBrowser'
import {useDevSignedIn} from 'lib/hooks/waverly/dev/useDevSignedIn'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'

export const DevDemoFeed = observer(function DevDemoFeed() {
  const pal = usePalette('default')
  const store = useStores()

  const {state} = useDevSignedIn()

  const feedModel = store.me.waverlyFeed

  useEffect(() => {
    store.shell.setMinimalShellMode(false)
  }, [store])

  let message: string | undefined
  if (state === 'signingIn') message = 'Signing in...'
  else if (state === 'error') message = 'Error signing in...'
  else if (!feedModel) message = 'Internal error!'
  else if (feedModel.isLoading) message = 'Loading feed...'
  else if (feedModel.isRefreshing) message = 'Refreshing feed...'
  else if (feedModel.isEmpty) message = 'Empty feed'
  else message = feedModel.error

  if (message) {
    return (
      <View style={s.p10}>
        <Text style={pal.text}>{message}</Text>
      </View>
    )
  }

  return <CardBrowser groupFeedModel={feedModel} />
})
