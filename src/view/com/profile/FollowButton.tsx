import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import * as Toast from '../util/Toast'
import {usePalette} from 'lib/hooks/usePalette'

const FollowButton = observer(
  ({did, declarationCid}: {did: string; declarationCid: string}) => {
    const store = useStores()
    const pal = usePalette('default')
    const isFollowing = store.me.follows.isFollowing(did)

    const onToggleFollow = async () => {
      if (store.me.follows.isFollowing(did)) {
        try {
          await apilib.unfollow(store, store.me.follows.getFollowUri(did))
          store.me.follows.removeFollow(did)
        } catch (e: any) {
          store.log.error('Failed fo delete follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      } else {
        try {
          const res = await apilib.follow(store, did, declarationCid)
          store.me.follows.addFollow(did, res.uri)
        } catch (e: any) {
          store.log.error('Failed fo create follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      }
    }

    return (
      <TouchableOpacity onPress={onToggleFollow}>
        <View style={[styles.btn, pal.btn]}>
          <Text type="button" style={[pal.text]}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  },
)

export default FollowButton

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },
})
