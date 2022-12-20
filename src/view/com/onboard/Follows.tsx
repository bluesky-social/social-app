import React from 'react'
import {SafeAreaView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {SuggestedFollows} from '../discover/SuggestedFollows'
import {Text} from '../util/Text'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'

export const Follows = observer(() => {
  const store = useStores()

  const onNoSuggestions = () => {
    // no suggestions, bounce from this view
    store.onboard.next()
  }
  const onPressNext = () => store.onboard.next()

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Suggested follows</Text>
      <SuggestedFollows onNoSuggestions={onNoSuggestions} />
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

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 24,
    paddingTop: 16,
  },
})
