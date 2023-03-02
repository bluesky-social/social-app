import {StyleSheet, View} from 'react-native'
import React from 'react'
import {PostMeta} from '../PostMeta'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/models/shell-ui'

const QuoteEmbed = ({quote}: {quote: ComposerOptsQuote}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container, pal.border]}>
      <PostMeta
        authorAvatar={quote.author.avatar}
        authorHandle={quote.author.handle}
        authorDisplayName={quote.author.displayName}
        timestamp={quote.indexedAt}
      />
      <Text type="post-text" style={pal.text} numberOfLines={6}>
        {quote.text}
      </Text>
    </View>
  )
}

export default QuoteEmbed

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  quotePost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
})
