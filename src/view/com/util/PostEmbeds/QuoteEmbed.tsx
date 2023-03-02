import {StyleSheet, View} from 'react-native'
import React from 'react'
import {UserAvatar} from '../UserAvatar'
import {PostMeta} from '../PostMeta'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/models/shell-ui'
import {colors} from 'lib/styles'

const QuoteEmbed = ({quote}: {quote: ComposerOptsQuote}) => {
  const pal = usePalette('default')
  return (
    <View style={styles.quoteContainer}>
      <UserAvatar
        handle={quote.author.handle}
        displayName={quote.author.displayName}
        avatar={quote.author.avatar}
        size={50}
      />
      <View style={styles.quotePost}>
        <PostMeta
          authorHandle={quote.author.handle}
          authorDisplayName={quote.author.displayName}
          timestamp={quote.indexedAt}
        />
        <Text type="post-text" style={pal.text} numberOfLines={6}>
          {quote.text}
        </Text>
      </View>
    </View>
  )
}

export default QuoteEmbed

const styles = StyleSheet.create({
  quoteContainer: {
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    borderColor: colors.gray2,
    borderWidth: 1,
    flexDirection: 'row',
  },
  quotePost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
})
