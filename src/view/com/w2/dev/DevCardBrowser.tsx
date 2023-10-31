import React, {useEffect, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {CardBrowser} from '../browser/CardBrowser'
import {useDevSignedIn} from 'lib/hooks/waverly/dev/useDevSignedIn'
import {GroupFeedModel} from 'state/models/feeds/waverly/group-feed'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'

const GROUP = 'betterweb.group'

export const DevCardBrowser = observer(function DevCardBrowser() {
  const pal = usePalette('default')
  const store = useStores()

  const {state} = useDevSignedIn()
  const [groupFeedModel, setGroupFeedModel] = useState<
    GroupFeedModel | undefined
  >(undefined)
  const [groupDid, setGroupDid] = useState<string | undefined>()

  useEffect(() => {
    if (state !== 'signedIn') return
    store.agent.com.atproto.identity
      .resolveHandle({handle: GROUP})
      .then(res => setGroupDid(res.data.did))
  }, [state, store])

  useEffect(() => {
    setGroupFeedModel(
      groupDid
        ? new GroupFeedModel(store, 'author', {actor: groupDid})
        : undefined,
    )
  }, [groupDid, store])

  useEffect(() => {
    groupFeedModel?.clear()
    groupFeedModel?.setup()
  }, [groupFeedModel])

  useEffect(() => {
    store.shell.setMinimalShellMode(false)
  }, [store])

  let message: string | undefined
  if (state === 'signingIn') message = 'Signing in...'
  else if (state === 'error') message = 'Error signing in...'
  else if (!groupFeedModel) message = 'Internal error!'
  else if (groupFeedModel.isLoading) message = 'Loading feed...'
  else if (groupFeedModel.isRefreshing) message = 'Refreshing feed...'
  else if (groupFeedModel.isEmpty) message = 'Empty feed'
  else message = groupFeedModel.error

  if (message) {
    return (
      <View style={s.p10}>
        <Text style={pal.text}>{message}</Text>
      </View>
    )
  }

  // Render a CardFeed with a dummy card
  return (
    <>
      <View style={styles.padding} />
      <View style={styles.fullscreen}>
        <CardBrowser groupFeedModel={groupFeedModel} />
      </View>
    </>
  )
})

const styles = StyleSheet.create({
  // Hack: padding so "Back to Dev Screen" appears near the bottom
  padding: {
    height: '86%',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
