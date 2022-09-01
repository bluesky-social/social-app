import React, {useState, useRef} from 'react'
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {s, colors} from '../../lib/styles'

export function LocationMenu({
  url,
  onNavigate,
  onDismiss,
}: {
  url: string
  onNavigate: (url: string) => void
  onDismiss: () => void
}) {
  const [searchText, onChangeSearchText] = useState(url !== '/' ? url : '')
  const inputRef = useRef<TextInput | null>(null)

  const onFocusSearchText = () => {
    if (inputRef.current && searchText.length) {
      // select the text on focus
      inputRef.current.setNativeProps({
        selection: {start: 0, end: searchText.length},
      })
    }
  }

  const FatMenuItem = ({
    icon,
    label,
    url,
    color,
  }: {
    icon: IconProp
    label: string
    url: string
    color: string
  }) => (
    <TouchableOpacity
      style={styles.fatMenuItem}
      onPress={() => onNavigate(url)}>
      <View style={[styles.fatMenuItemIconWrapper, {backgroundColor: color}]}>
        <FontAwesomeIcon icon={icon} style={styles.fatMenuItemIcon} size={24} />
      </View>
      <Text style={styles.fatMenuItemLabel}>{label}</Text>
    </TouchableOpacity>
  )

  const ThinMenuItem = ({label, url}: {label: string; url: string}) => (
    <TouchableOpacity
      style={styles.thinMenuItem}
      onPress={() => onNavigate(url)}>
      <Text style={styles.thinMenuItemLabel}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.menu}>
      <View style={styles.searchContainer}>
        <FontAwesomeIcon
          icon="magnifying-glass"
          size={18}
          style={styles.searchIcon}
        />
        <TextInput
          autoFocus
          ref={inputRef}
          value={searchText}
          style={styles.searchInput}
          onChangeText={onChangeSearchText}
          onFocus={onFocusSearchText}
        />
        <TouchableOpacity onPress={() => onDismiss()}>
          <Text style={[s.blue3, s.f15]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.menuItemsContainer}>
        <View style={styles.fatMenuItems}>
          <FatMenuItem icon="house" label="Feed" url="/" color={colors.red3} />
          <FatMenuItem
            icon="bell"
            label="Notifications"
            url="/notifications"
            color={colors.pink3}
          />
          <FatMenuItem
            icon={['far', 'user']}
            label="My Profile"
            url="/"
            color={colors.purple3}
          />
          <FatMenuItem
            icon="gear"
            label="Settings"
            url="/"
            color={colors.blue3}
          />
        </View>
        <View style={styles.thinMenuItems}>
          <ThinMenuItem label="Send us feedback" url="/" />
          <ThinMenuItem label="Get help..." url="/" />
          <ThinMenuItem label="Settings" url="/" />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    opacity: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray1,
    borderBottomWidth: 1,
    borderColor: colors.gray2,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },
  searchIcon: {
    color: colors.gray5,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
  },
  menuItemsContainer: {
    paddingVertical: 30,
  },
  fatMenuItems: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  fatMenuItem: {
    width: 90,
    alignItems: 'center',
    marginRight: 6,
  },
  fatMenuItemIconWrapper: {
    borderRadius: 6,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
  },
  fatMenuItemIcon: {
    color: colors.white,
  },
  fatMenuItemLabel: {
    fontSize: 12,
  },
  thinMenuItems: {
    paddingHorizontal: 18,
  },
  thinMenuItem: {
    paddingVertical: 4,
  },
  thinMenuItemLabel: {
    color: colors.blue3,
    fontSize: 16,
  },
})
