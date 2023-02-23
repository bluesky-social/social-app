import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from '../../com/util/text/Text'
import {LiteSuggestedFollows} from '../../com/discover/LiteSuggestedFollows'
import {s} from 'lib/styles'
import {useStores} from 'state/index'

export const DesktopRightColumn: React.FC = () => {
  const store = useStores()
  return (
    <View style={styles.container}>
      <Text type="lg-bold" style={s.mb10}>
        Suggested Follows
      </Text>
      <LiteSuggestedFollows />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    width: '400px',
    paddingHorizontal: 16,
    paddingRight: 32,
    paddingTop: 20,
  },
})
