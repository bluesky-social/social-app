import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from './text/Text'
import {Link} from './Link'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {ComposeIcon, MagnifyingGlassIcon} from 'lib/icons'
import {colors} from 'lib/styles'

export const ViewHeader = observer(function ViewHeader({
  title,
}: {
  title: string
  canGoBack?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPressCompose = () => store.shell.openComposer({})
  return (
    <View style={[styles.header, pal.borderDark, pal.view]}>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="title-2xl" style={[pal.text, styles.title]}>
          {title}
        </Text>
      </View>
      <TouchableOpacity style={[styles.newPostBtn]} onPress={onPressCompose}>
        <View style={styles.newPostBtnIconWrapper}>
          <ComposeIcon
            size={16}
            strokeWidth={1.5}
            style={styles.newPostBtnLabel}
          />
        </View>
        <Text type="md" style={styles.newPostBtnLabel}>
          New Post
        </Text>
      </TouchableOpacity>
      <Link href="/search" style={[pal.view, pal.borderDark, styles.search]}>
        <MagnifyingGlassIcon
          size={18}
          style={[pal.textLight, styles.searchIconWrapper]}
        />
        <Text type="md-thin" style={pal.textLight}>
          Search
        </Text>
      </Link>
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 18,
    paddingLeft: 30,
    paddingRight: 40,
    marginLeft: 300,
    borderBottomWidth: 1,
  },

  titleContainer: {
    marginRight: 'auto',
  },
  title: {
    fontWeight: 'bold',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  searchIconWrapper: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'center',
    marginRight: 2,
  },

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 18,
    backgroundColor: colors.blue3,
    marginRight: 10,
  },
  newPostBtnIconWrapper: {
    marginRight: 8,
  },
  newPostBtnLabel: {
    color: colors.white,
  },
})
