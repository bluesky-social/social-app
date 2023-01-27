import React from 'react'
import {SafeAreaView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {SuggestedFollows} from '../discover/SuggestedFollows'
import {CenteredView} from '../util/Views.web'
import {Text} from '../util/text/Text'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const Follows = observer(() => {
  const store = useStores()

  const onNoSuggestions = () => {
    // no suggestions, bounce from this view
    store.onboard.next()
  }
  const onPressNext = () => store.onboard.next()

  return (
    <SafeAreaView style={styles.container}>
      <CenteredView style={styles.header}>
        <Text type="title-lg">
          Follow these people to see their posts in your feed
        </Text>
        <TouchableOpacity onPress={onPressNext}>
          <Text style={[styles.title, s.blue3, s.pr10]}>Next &raquo;</Text>
        </TouchableOpacity>
      </CenteredView>
      <SuggestedFollows onNoSuggestions={onNoSuggestions} />
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
  },

  header: {
    paddingTop: 30,
    paddingBottom: 40,
  },
})
