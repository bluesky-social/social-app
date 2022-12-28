import React, {useMemo, useEffect, useState} from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import _omit from 'lodash.omit'
import {ErrorScreen} from '../util/error/ErrorScreen'
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
import {s, colors, gradients} from '../../lib/styles'

export const SuggestedFollows = observer(
  ({
    onNoSuggestions,
    asLinks,
  }: {
    onNoSuggestions?: () => void
    asLinks?: boolean
  }) => {
    const store = useStores()
    const [follows, setFollows] = useState<Record<string, string>>({})

    const view = useMemo<SuggestedActorsViewModel>(
      () => new SuggestedActorsViewModel(store),
      [],
    )

    useEffect(() => {
      console.log('Fetching suggested actors')
      view
        .setup()
        .catch((err: any) => console.error('Failed to fetch suggestions', err))
    }, [view])

    useEffect(() => {
      if (!view.isLoading && !view.hasError && !view.hasContent) {
        onNoSuggestions?.()
      }
    }, [view, view.isLoading, view.hasError, view.hasContent])

    const onPressTryAgain = () =>
      view
        .setup()
        .catch((err: any) => console.error('Failed to fetch suggestions', err))

    const onPressFollow = async (item: SuggestedActor) => {
      try {
        const res = await apilib.follow(store, item.did, item.declaration.cid)
        setFollows({[item.did]: res.uri, ...follows})
      } catch (e) {
        console.log(e)
        Toast.show('An issue occurred, please try again.')
      }
    }
    const onPressUnfollow = async (item: SuggestedActor) => {
      try {
        await apilib.unfollow(store, follows[item.did])
        setFollows(_omit(follows, [item.did]))
      } catch (e) {
        console.log(e)
        Toast.show('An issue occurred, please try again.')
      }
    }

    const renderItem = ({item}: {item: SuggestedActor}) => {
      if (asLinks) {
        return (
          <Link
            href={`/profile/${item.handle}`}
            title={item.displayName || item.handle}>
            <User
              item={item}
              follow={follows[item.did]}
              onPressFollow={onPressFollow}
              onPressUnfollow={onPressUnfollow}
            />
          </Link>
        )
      }
      return (
        <User
          item={item}
          follow={follows[item.did]}
          onPressFollow={onPressFollow}
          onPressUnfollow={onPressUnfollow}
        />
      )
    }
    return (
      <View style={styles.container}>
        {view.isLoading ? (
          <View>
            <ActivityIndicator />
          </View>
        ) : view.hasError ? (
          <ErrorScreen
            title="Failed to load suggestions"
            message="There was an error while trying to load suggested follows."
            details={view.error}
            onPressTryAgain={onPressTryAgain}
          />
        ) : view.isEmpty ? (
          <View />
        ) : (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={view.suggestions}
              keyExtractor={item => item._reactKey}
              renderItem={renderItem}
              style={s.flex1}
            />
          </View>
        )}
      </View>
    )
  },
)

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
  return (
    <View style={styles.actor}>
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
          <Text style={[s.f17, s.bold]} numberOfLines={1}>
            {item.displayName || item.handle}
          </Text>
          <Text style={[s.f14, s.gray5]} numberOfLines={1}>
            @{item.handle}
          </Text>
        </View>
        <View style={styles.actorBtn}>
          {follow ? (
            <TouchableOpacity onPress={() => onPressUnfollow(item)}>
              <View style={[styles.btn, styles.secondaryBtn]}>
                <Text style={[s.gray5, s.fw600, s.f15]}>Unfollow</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onPressFollow(item)}>
              <LinearGradient
                colors={[gradients.primary.start, gradients.primary.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.btn, styles.gradientBtn]}>
                <FontAwesomeIcon
                  icon="plus"
                  style={[s.white, s.mr5]}
                  size={15}
                />
                <Text style={[s.white, s.fw600, s.f15]}>Follow</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {item.description ? (
        <View style={styles.actorDetails}>
          <Text style={[s.f15]} numberOfLines={4}>
            {item.description}
          </Text>
        </View>
      ) : undefined}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  suggestionsContainer: {
    flex: 1,
    backgroundColor: colors.gray1,
  },

  emptyContainer: {
    backgroundColor: colors.gray1,
    marginHorizontal: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 6,
  },

  actor: {
    backgroundColor: colors.white,
    borderRadius: 6,
    margin: 2,
    marginBottom: 0,
  },
  actorMeta: {
    flexDirection: 'row',
  },
  actorAvi: {
    width: 60,
    paddingLeft: 10,
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
  actorDetails: {
    paddingLeft: 60,
    paddingRight: 10,
    paddingBottom: 10,
  },

  gradientBtn: {
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: colors.gray1,
    marginLeft: 6,
  },
})
