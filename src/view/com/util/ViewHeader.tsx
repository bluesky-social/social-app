import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAvatar} from './UserAvatar'
import {colors} from '../../lib/styles'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {useStores} from '../../../state'

export function ViewHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressSearch = () => {
    store.nav.navigate(`/search`)
  }
  return (
    <View style={styles.header}>
      {store.nav.tab.canGoBack ? (
        <TouchableOpacity onPress={onPressBack} style={styles.backIcon}>
          <FontAwesomeIcon size={18} icon="angle-left" style={{marginTop: 6}} />
        </TouchableOpacity>
      ) : (
        <View style={styles.cornerPlaceholder} />
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity onPress={onPressSearch} style={styles.searchBtn}>
        <MagnifyingGlassIcon size={17} style={styles.searchBtnIcon} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomColor: colors.gray1,
    borderBottomWidth: 1,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    marginLeft: 3,
    color: colors.gray4,
    maxWidth: 200,
  },

  cornerPlaceholder: {
    width: 30,
    height: 30,
  },
  backIcon: {width: 30, height: 30},
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray1,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  searchBtnIcon: {
    color: colors.black,
    position: 'relative',
    top: -1,
  },
})
