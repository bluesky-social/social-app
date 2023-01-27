import React from 'react'
import {View, StyleSheet} from 'react-native'
import {Link} from '../../com/util/Link'
import {Text} from '../../com/util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {LiteSuggestedFollows} from '../../com/discover/LiteSuggestedFollows'
import {s} from '../../lib/styles'

export const DesktopRightColumn: React.FC = () => {
  const pal = usePalette('default')
  return (
    <View style={[styles.container, pal.border]}>
      <Link href="/search" style={[pal.btn, styles.searchContainer]}>
        <View style={styles.searchIcon}>
          <MagnifyingGlassIcon style={pal.textLight} />
        </View>
        <Text type="lg" style={pal.textLight}>
          Search
        </Text>
      </Link>
      <Text type="xl-bold" style={s.mb10}>
        Suggested Follows
      </Text>
      <LiteSuggestedFollows />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 'calc(50vw - 650px)',
    width: '350px',
    height: '100%',
    borderLeftWidth: 1,
    overscrollBehavior: 'auto',
    paddingLeft: 30,
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 5,
  },
})
