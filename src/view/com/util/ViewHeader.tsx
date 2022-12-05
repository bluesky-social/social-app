import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {useStores} from '../../../state'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}
const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export function ViewHeader({
  title,
  subtitle,
  onPost,
}: {
  title: string
  subtitle?: string
  onPost?: () => void
}) {
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressCompose = () => {
    store.shell.openComposer({onPost})
  }
  const onPressSearch = () => {
    store.nav.navigate(`/search`)
  }
  return (
    <View style={styles.header}>
      {store.nav.tab.canGoBack ? (
        <TouchableOpacity
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={styles.backIcon}>
          <FontAwesomeIcon size={18} icon="angle-left" style={{marginTop: 6}} />
        </TouchableOpacity>
      ) : undefined}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity
        onPress={onPressCompose}
        hitSlop={HITSLOP}
        style={styles.btn}>
        <FontAwesomeIcon size={18} icon="plus" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onPressSearch}
        hitSlop={HITSLOP}
        style={[styles.btn, {marginLeft: 8}]}>
        <MagnifyingGlassIcon
          size={18}
          strokeWidth={3}
          style={styles.searchBtnIcon}
        />
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
    marginRight: 'auto',
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 18,
    marginLeft: 6,
    color: colors.gray4,
    maxWidth: 200,
  },

  backIcon: {width: 30, height: 30},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray1,
    width: 36,
    height: 36,
    borderRadius: 20,
  },
  searchBtnIcon: {
    color: colors.black,
    position: 'relative',
    top: -1,
  },
})
