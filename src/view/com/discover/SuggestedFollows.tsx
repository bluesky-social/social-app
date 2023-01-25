import React, {useEffect, useState} from 'react'
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
import {s, gradients} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'

export const SuggestedFollows = observer(
  ({
    onNoSuggestions,
    asLinks,
  }: {
    onNoSuggestions?: () => void
    asLinks?: boolean
  }) => {
    const pal = usePalette('default')
    const store = useStores()
    const [follows, setFollows] = useState<Record<string, string>>({})

    // Using default import (React.use...) instead of named import (use...) to be able to mock store's data in jest environment
    const view = React.useMemo<SuggestedActorsViewModel>(
      () => new SuggestedActorsViewModel(store),
      [store],
    )

    useEffect(() => {
      view
        .loadMore()
        .catch((err: any) =>
          store.log.error('Failed to fetch suggestions', err),
        )
    }, [view, store.log])

    useEffect(() => {
      if (!view.isLoading && !view.hasError && !view.hasContent) {
        onNoSuggestions?.()
      }
    }, [view, view.isLoading, view.hasError, view.hasContent, onNoSuggestions])

    const onRefresh = () => {
      view
        .refresh()
        .catch((err: any) =>
          store.log.error('Failed to fetch suggestions', err),
        )
    }
    const onEndReached = () => {
      view
        .loadMore()
        .catch(err =>
          view?.rootStore.log.error('Failed to load more suggestions', err),
        )
    }

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
        {view.hasError ? (
          <ErrorScreen
            title="Failed to load suggestions"
            message="There was an error while trying to load suggested follows."
            details={view.error}
            onPressTryAgain={onRefresh}
          />
        ) : view.isEmpty ? (
          <View />
        ) : (
          <View style={[styles.suggestionsContainer, pal.view]}>
            <FlatList
              data={view.suggestions}
              keyExtractor={item => item.did}
              refreshing={view.isRefreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              renderItem={renderItem}
              initialNumToRender={15}
              ListFooterComponent={() => (
                <View style={styles.footer}>
                  {view.isLoading && <ActivityIndicator />}
                </View>
              )}
              contentContainerStyle={s.contentContainer}
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
  const pal = usePalette('default')
  return (
    <View style={[styles.actor, pal.view, pal.border]}>
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
          <Text type="title-sm" style={pal.text} numberOfLines={1}>
            {item.displayName || item.handle}
          </Text>
          <Text style={pal.textLight} numberOfLines={1}>
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
          <Text style={pal.text} numberOfLines={4}>
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
  },
  footer: {
    height: 200,
    paddingTop: 20,
  },

  actor: {
    borderTopWidth: 1,
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
    marginLeft: 6,
  },
})
