import React, {useState, useEffect, useMemo} from 'react'
import Toast from '../util/Toast'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  TabView,
  SceneMap,
  Route,
  TabBar,
  TabBarProps,
} from 'react-native-tab-view'
import _omit from 'lodash.omit'
import {AtUri} from '../../../third-party/uri'
import {ProfileCard} from '../profile/ProfileCard'
import {ErrorMessage} from '../util/ErrorMessage'
import {useStores} from '../../../state'
import * as apilib from '../../../state/lib/api'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {SuggestedInvites} from '../../../state/models/suggested-invites'
import {FollowItem} from '../../../state/models/user-follows-view'
import {s, colors} from '../../lib/styles'

export const snapPoints = ['70%']

export function Component({profileView}: {profileView: ProfileViewModel}) {
  const store = useStores()
  const layout = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const tabRoutes = [
    {key: 'suggestions', title: 'Suggestions'},
    {key: 'pending', title: 'Pending Invites'},
  ]
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const suggestions = useMemo(
    () => new SuggestedInvites(store, {sceneDid: profileView.did}),
    [profileView.did],
  )
  const [createdInvites, setCreatedInvites] = useState<Record<string, string>>(
    {},
  )

  useEffect(() => {
    let aborted = false
    if (hasSetup) {
      return
    }
    suggestions.setup().then(() => {
      if (aborted) return
      setHasSetup(true)
    })
    return () => {
      aborted = true
    }
  }, [profileView.did])

  const onPressInvite = async (follow: FollowItem) => {
    setError('')
    try {
      const assertionUri = await apilib.inviteToScene(
        store,
        profileView.did,
        follow.did,
        follow.declaration.cid,
      )
      setCreatedInvites({[follow.did]: assertionUri, ...createdInvites})
      Toast.show('Invite sent', {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
      })
    } catch (e) {
      setError('There was an issue with the invite. Please try again.')
      console.error(e)
    }
  }
  const onPressUndo = async (subjectDid: string, assertionUri: string) => {
    setError('')
    const urip = new AtUri(assertionUri)
    try {
      await store.api.app.bsky.graph.assertion.delete({
        did: profileView.did,
        rkey: urip.rkey,
      })
      setCreatedInvites(_omit(createdInvites, [subjectDid]))
    } catch (e) {
      setError('There was an issue with the invite. Please try again.')
      console.error(e)
    }
  }

  const renderSuggestionItem = ({item}: {item: FollowItem}) => {
    const createdInvite = createdInvites[item.did]
    return (
      <ProfileCard
        did={item.did}
        handle={item.handle}
        displayName={item.displayName}
        renderButton={() =>
          !createdInvite ? (
            <>
              <FontAwesomeIcon icon="user-plus" style={[s.mr5]} size={14} />
              <Text style={[s.fw400, s.f14]}>Invite</Text>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon="x" style={[s.mr5]} size={14} />
              <Text style={[s.fw400, s.f14]}>Undo invite</Text>
            </>
          )
        }
        onPressButton={() =>
          !createdInvite
            ? onPressInvite(item)
            : onPressUndo(item.did, createdInvite)
        }
      />
    )
  }

  const Suggestions = () => (
    <View style={s.flex1}>
      {hasSetup ? (
        <View style={s.flex1}>
          <View style={styles.todoContainer}>
            <Text style={styles.todoLabel}>
              User search is still being implemented. For now, you can pick from
              your follows below.
            </Text>
          </View>
          {!suggestions.hasContent ? (
            <Text
              style={{
                textAlign: 'center',
                paddingTop: 10,
                paddingHorizontal: 40,
                fontWeight: 'bold',
                color: colors.gray5,
              }}>
              {suggestions.myFollowsView.follows.length
                ? 'Sorry! You dont follow anybody for us to suggest.'
                : 'Sorry! All of the users you follow are members already.'}
            </Text>
          ) : (
            <FlatList
              data={suggestions.suggestions}
              keyExtractor={item => item._reactKey}
              renderItem={renderSuggestionItem}
              style={s.flex1}
            />
          )}
        </View>
      ) : !error ? (
        <ActivityIndicator />
      ) : undefined}
    </View>
  )

  const PendingInvites = () => (
    <View>
      <View style={styles.todoContainer}>
        <Text style={styles.todoLabel}>
          Pending invites are still being implemented. Check back soon!
        </Text>
      </View>
    </View>
  )

  const renderScene = SceneMap({
    suggestions: Suggestions,
    pending: PendingInvites,
  })

  const renderTabBar = (props: TabBarProps<Route>) => (
    <TabBar
      {...props}
      style={{backgroundColor: 'white'}}
      activeColor="black"
      inactiveColor={colors.gray5}
      labelStyle={{textTransform: 'none'}}
      indicatorStyle={{backgroundColor: colors.purple3}}
    />
  )

  return (
    <View style={s.flex1}>
      <Text style={styles.title}>
        Invite to {profileView.displayName || profileView.handle}
      </Text>
      {error !== '' ? (
        <View style={s.p10}>
          <ErrorMessage message={error} />
        </View>
      ) : undefined}
      <TabView
        navigationState={{index, routes: tabRoutes}}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  todoContainer: {
    backgroundColor: colors.pink1,
    margin: 10,
    padding: 10,
    borderRadius: 6,
  },
  todoLabel: {
    color: colors.pink5,
    textAlign: 'center',
  },

  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
})
