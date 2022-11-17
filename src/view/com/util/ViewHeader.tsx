import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAvatar} from './UserAvatar'
import {colors} from '../../lib/styles'
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
  const onPressAvatar = () => {
    if (store.me.handle) {
      store.nav.navigate(`/profile/${store.me.handle}`)
    }
  }
  return (
    <View style={styles.header}>
      {store.nav.tab.canGoBack ? (
        <TouchableOpacity onPress={onPressBack} style={styles.backIcon}>
          <FontAwesomeIcon size={18} icon="angle-left" style={{marginTop: 3}} />
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
      {store.me.did ? (
        <TouchableOpacity onPress={onPressAvatar}>
          <UserAvatar
            size={24}
            handle={store.me.handle || ''}
            displayName={store.me.displayName}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.cornerPlaceholder} />
      )}
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
    width: 24,
    height: 24,
  },
  backIcon: {width: 24, height: 24},
})
