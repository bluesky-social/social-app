import React, {useEffect, useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {observer} from 'mobx-react-lite'
import _omit from 'lodash.omit'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import * as Toast from '../util/Toast'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {
  SuggestedActorsViewModel,
  SuggestedActor,
} from '../../../state/models/suggested-actors-view'
import {s, gradients} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

export const LiteSuggestedFollows = observer(() => {
  const store = useStores()
  const [suggestions, setSuggestions] = useState<SuggestedActor[] | undefined>(
    undefined,
  )
  const [follows, setFollows] = useState<Record<string, string>>({})

  useEffect(() => {
    const view = new SuggestedActorsViewModel(store)
    view.loadMore().then(
      () => {
        setSuggestions(view.suggestions.slice().sort(randomize).slice(0, 3))
      },
      (err: any) => {
        setSuggestions([])
        store.log.error('Failed to fetch suggestions', err)
      },
    )
  }, [store, store.log])

  const onPressFollow = async (item: SuggestedActor) => {
    try {
      const res = await apilib.follow(store, item.did, item.declaration.cid)
      setFollows({[item.did]: res.uri, ...follows})
    } catch (e: any) {
      store.log.error('Failed fo create follow', e)
      Toast.show('An issue occurred, please try again.')
    }
  }
  const onPressUnfollow = async (item: SuggestedActor) => {
    try {
      await apilib.unfollow(store, follows[item.did])
      setFollows(_omit(follows, [item.did]))
    } catch (e: any) {
      store.log.error('Failed fo delete follow', e)
      Toast.show('An issue occurred, please try again.')
    }
  }

  return (
    <View>
      {!suggestions ? (
        <View>
          <ActivityIndicator />
        </View>
      ) : (
        <View>
          {suggestions.map(item => (
            <Link
              key={item.did}
              href={`/profile/${item.handle}`}
              title={item.displayName || item.handle}>
              <User
                item={item}
                follow={follows[item.did]}
                onPressFollow={onPressFollow}
                onPressUnfollow={onPressUnfollow}
              />
            </Link>
          ))}
        </View>
      )}
    </View>
  )
})

const User = ({
  item,
  follow,
  onPressFollow,
  onPressUnfollow,
}: {
  item: SuggestedActor
  follow: string | undefined
  onPressFollow: (item: SuggestedActor) => void
  onPressUnfollow: (item: SuggestedActor) => void
}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.actor]}>
      <View style={styles.actorMeta}>
        <View style={styles.actorAvi}>
          <UserAvatar
            size={40}
            displayName={item.displayName}
            handle={item.handle}
            avatar={item.avatar}
          />
        </View>
        <View style={styles.actorContent}>
          <Text type="lg-medium" style={pal.text} numberOfLines={1}>
            {item.displayName || item.handle}
          </Text>
          <Text type="sm" style={pal.textLight} numberOfLines={1}>
            @{item.handle}
          </Text>
        </View>
        <View style={styles.actorBtn}>
          {follow ? (
            <TouchableOpacity onPress={() => onPressUnfollow(item)}>
              <View style={[styles.btn, styles.secondaryBtn, pal.btn]}>
                <Text type="button" style={pal.text}>
                  Unfollow
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onPressFollow(item)}>
              <LinearGradient
                colors={[gradients.blueLight.start, gradients.blueLight.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.btn, styles.gradientBtn]}>
                <Text type="sm-medium" style={s.white}>
                  Follow
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

function randomize() {
  return Math.random() > 0.5 ? 1 : -1
}

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },

  actor: {},
  actorMeta: {
    flexDirection: 'row',
  },
  actorAvi: {
    width: 50,
    paddingTop: 10,
    paddingBottom: 10,
  },
  actorContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
  },
  actorBtn: {
    paddingRight: 10,
    paddingTop: 10,
  },

  gradientBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  secondaryBtn: {
    paddingHorizontal: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
})
