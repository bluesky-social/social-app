import {StyleSheet} from 'react-native'
import React from 'react'
import {AtUri} from '../../../../third-party/uri'
import {PostMeta} from '../PostMeta'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ComposerOptsQuote} from 'state/models/shell-ui'

const QuoteEmbed = ({quote}: {quote: ComposerOptsQuote}) => {
  const pal = usePalette('default')
  const itemUrip = new AtUri(quote.uri)
  const itemHref = `/profile/${quote.author.handle}/post/${itemUrip.rkey}`
  const itemTitle = `Post by ${quote.author.handle}`
  const isEmpty = React.useMemo(
    () => quote.text.trim().length === 0,
    [quote.text],
  )
  return (
    <Link
      style={[styles.container, pal.border]}
      href={itemHref}
      title={itemTitle}>
      <PostMeta
        authorAvatar={quote.author.avatar}
        authorHandle={quote.author.handle}
        authorDisplayName={quote.author.displayName}
        postHref={itemHref}
        timestamp={quote.indexedAt}
      />
      <Text type="post-text" style={pal.text} numberOfLines={6}>
        {isEmpty ? (
          <Text style={pal.link} lineHeight={1.5}>
            View post
          </Text>
        ) : (
          quote.text
        )}
      </Text>
    </Link>
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
