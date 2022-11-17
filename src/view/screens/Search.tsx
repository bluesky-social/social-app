import React, {useEffect} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {FAB} from '../com/util/FloatingActionButton'
import {SuggestedFollows} from '../com/discover/SuggestedFollows'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {colors} from '../lib/styles'

export const Search = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, `Search`)
    }
  }, [store, visible, name])
  const onComposePress = () => {
    store.shell.openComposer({})
  }

  return (
    <View style={styles.container}>
      <ViewHeader title="Search" />
      <View style={styles.todoContainer}>
        <Text style={styles.todoLabel}>
          Search is still being implemented. Check back soon!
        </Text>
      </View>
      <Text style={styles.heading}>Suggested follows</Text>
      <SuggestedFollows asLinks />
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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

  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 12,
  },
})
