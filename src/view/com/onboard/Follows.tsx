import React, {useMemo, useEffect} from 'react'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {ErrorScreen} from '../util/ErrorScreen'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {
  SuggestedActorsViewModel,
  SuggestedActor,
} from '../../../state/models/suggested-actors-view'
import {s, colors, gradients} from '../../lib/styles'

export const Follows = observer(() => {
  const store = useStores()

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
      // no suggestions, bounce from this view
      store.onboard.next()
    }
  }, [view, view.isLoading, view.hasError, view.hasContent])

  const onPressTryAgain = () =>
    view
      .setup()
      .catch((err: any) => console.error('Failed to fetch suggestions', err))
  const onPressNext = () => store.onboard.next()

  const renderItem = ({item}: {item: SuggestedActor}) => <User item={item} />
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Suggested follows</Text>
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
      <View style={styles.footer}>
        <TouchableOpacity onPress={onPressNext}>
          <Text style={[s.blue3, s.f18]}>Skip</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressNext}>
          <Text style={[s.blue3, s.f18]}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
})

const User = ({item}: {item: SuggestedActor}) => {
  return (
    <View style={styles.actor}>
      <View style={styles.actorMeta}>
        <View style={styles.actorAvi}>
          <UserAvatar
            size={40}
            displayName={item.displayName}
            handle={item.handle}
          />
        </View>
        <View style={styles.actorContent}>
          <Text style={[s.f17, s.bold]} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={[s.f14, s.gray5]} numberOfLines={1}>
            @{item.handle}
          </Text>
        </View>
        <View style={styles.actorBtn}>
          <TouchableOpacity>
            <LinearGradient
              colors={[gradients.primary.start, gradients.primary.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.btn, styles.gradientBtn]}>
              <FontAwesomeIcon icon="plus" style={[s.white, s.mr5]} size={15} />
              <Text style={[s.white, s.fw600, s.f15]}>Follow</Text>
            </LinearGradient>
          </TouchableOpacity>
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

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  suggestionsContainer: {
    flex: 1,
    backgroundColor: colors.gray1,
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

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 24,
    paddingTop: 16,
  },
})
