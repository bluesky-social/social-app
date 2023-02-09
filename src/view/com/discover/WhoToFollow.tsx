import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import _omit from 'lodash.omit'
import {useStores} from '../../../state'
import {
  SuggestedActorsViewModel,
  SuggestedActor,
} from '../../../state/models/suggested-actors-view'
import * as apilib from '../../../state/lib/api'
import {s, gradients} from '../../lib/styles'
import {ProfileCard} from '../profile/ProfileCard'
import * as Toast from '../util/Toast'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

export const WhoToFollow = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const [follows, setFollows] = React.useState<Record<string, string>>({})
  const suggestedActorsView = React.useMemo<SuggestedActorsViewModel>(
    () => new SuggestedActorsViewModel(store, {pageSize: 5}),
    [store],
  )

  React.useEffect(() => {
    suggestedActorsView.loadMore(true)
  }, [store, suggestedActorsView])

  const onPressLoadMoreSuggestedActors = () => {
    suggestedActorsView.loadMore()
  }
  const onToggleFollow = async (item: SuggestedActor) => {
    if (follows[item.did]) {
      try {
        await apilib.unfollow(store, follows[item.did])
        setFollows(_omit(follows, [item.did]))
      } catch (e: any) {
        store.log.error('Failed fo delete follow', e)
        Toast.show('An issue occurred, please try again.')
      }
    } else {
      try {
        const res = await apilib.follow(store, item.did, item.declaration.cid)
        setFollows({[item.did]: res.uri, ...follows})
      } catch (e: any) {
        store.log.error('Failed fo create follow', e)
        Toast.show('An issue occurred, please try again.')
      }
    }
  }
  return (
    <>
      {(suggestedActorsView.hasContent || suggestedActorsView.isLoading) && (
        <Text type="lg-heavy" style={[styles.heading, pal.text]}>
          Who to follow
        </Text>
      )}
      {suggestedActorsView.hasContent && (
        <>
          <View style={[pal.border, styles.bottomBorder]}>
            {suggestedActorsView.suggestions.map(item => (
              <ProfileCard
                key={item.did}
                handle={item.handle}
                displayName={item.displayName}
                avatar={item.avatar}
                description={item.description}
                renderButton={() => (
                  <FollowBtn
                    isFollowing={!!follows[item.did]}
                    onPress={() => onToggleFollow(item)}
                  />
                )}
              />
            ))}
          </View>
          {!suggestedActorsView.isLoading && suggestedActorsView.hasMore && (
            <TouchableOpacity
              onPress={onPressLoadMoreSuggestedActors}
              style={styles.loadMore}>
              <Text type="md-medium" style={pal.link}>
                Show more
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
      {suggestedActorsView.isLoading && (
        <View style={s.mt10}>
          <ActivityIndicator />
        </View>
      )}
    </>
  )
})

function FollowBtn({
  isFollowing,
  onPress,
}: {
  isFollowing: boolean
  onPress: () => void
}) {
  const pal = usePalette('default')
  if (isFollowing) {
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={[styles.btn, pal.btn]}>
          <Text type="button" style={pal.text}>
            Unfollow
          </Text>
        </View>
      </TouchableOpacity>
    )
  }
  return (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={[gradients.blueLight.start, gradients.blueLight.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.btn, styles.gradientBtn]}>
        <FontAwesomeIcon icon="plus" style={[s.white, s.mr5]} size={15} />
        <Text style={[s.white, s.fw600, s.f15]}>Follow</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },

  bottomBorder: {
    borderBottomWidth: 1,
  },

  loadMore: {
    paddingLeft: 12,
    paddingVertical: 10,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },
  gradientBtn: {
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
})
