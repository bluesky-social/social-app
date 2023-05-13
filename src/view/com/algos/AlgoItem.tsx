import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from '../util/text/Text'
import {AppBskyFeedDefs} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {UserAvatar} from '../util/UserAvatar'

const AlgoItem = ({item}: {item: AppBskyFeedDefs.GeneratorView}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container]} key={item.uri}>
      <View style={[styles.headerContainer]}>
        <View style={[s.mr20]}>
          <UserAvatar size={56} avatar={item.avatar} />
        </View>
        <View style={[styles.headerTextContainer]}>
          <Text style={[pal.text, s.bold]}>
            {item.displayName ?? 'Feed name'}
          </Text>
          <Text style={[pal.textLight, styles.description]}>
            {item.description ??
              'THIS IS A FEED DESCRIPTION, IT WILL TELL YOU WHAT THE FEED IS ABOUT. THIS IS A COOL FEED ABOUT COOL PEOPLE.'}
          </Text>
        </View>
      </View>

      {/* TODO: this feed is like by *3* people UserAvatars and others */}
    </View>
  )
}

export default AlgoItem

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: 'column',
    columnGap: 36,
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  headerContainer: {
    flexDirection: 'row',
  },
  headerTextContainer: {
    flexDirection: 'column',
    columnGap: 4,
    flex: 1,
  },
  description: {
    flex: 1,
    flexWrap: 'wrap',
  },
})
