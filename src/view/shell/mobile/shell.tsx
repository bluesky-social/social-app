import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from '../../../state'
import {match} from '../../routes'

const Location = ({icon, title}: {icon: IconProp; title?: string}) => {
  return (
    <TouchableOpacity style={styles.location}>
      {title ? (
        <FontAwesomeIcon size={16} style={styles.locationIcon} icon={icon} />
      ) : (
        <FontAwesomeIcon
          size={16}
          style={styles.locationIconLight}
          icon="magnifying-glass"
        />
      )}
      <Text style={title ? styles.locationText : styles.locationTextLight}>
        {title || 'Search'}
      </Text>
    </TouchableOpacity>
  )
}

const Btn = ({
  icon,
  inactive,
  onPress,
}: {
  icon: IconProp
  inactive?: boolean
  onPress?: (event: GestureResponderEvent) => void
}) => {
  if (inactive) {
    return (
      <View style={styles.ctrl}>
        <FontAwesomeIcon
          size={18}
          style={[styles.ctrlIcon, styles.inactive]}
          icon={icon}
        />
      </View>
    )
  }
  return (
    <TouchableOpacity style={styles.ctrl} onPress={onPress}>
      <FontAwesomeIcon size={18} style={styles.ctrlIcon} icon={icon} />
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const stores = useStores()
  const onPressBack = () => stores.nav.tab.goBack()
  const onPressForward = () => stores.nav.tab.goForward()
  const onPressHome = () => stores.nav.navigate('/')
  const {Com, icon, params} = match(stores.nav.tab.current.url)
  return (
    <View style={styles.outerContainer}>
      <View style={styles.topBar}>
        <Location icon={icon} title={stores.nav.tab.current.title} />
      </View>
      <SafeAreaView style={styles.innerContainer}>
        <Com params={params} />
      </SafeAreaView>
      <View style={styles.bottomBar}>
        <Btn
          icon="angle-left"
          inactive={!stores.nav.tab.canGoBack}
          onPress={onPressBack}
        />
        <Btn
          icon="angle-right"
          inactive={!stores.nav.tab.canGoForward}
          onPress={onPressForward}
        />
        <Btn icon="house" onPress={onPressHome} />
        <Btn icon={['far', 'bell']} />
        <Btn icon={['far', 'clone']} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
  innerContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 40,
    paddingBottom: 5,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#F8F3F3',
  },
  locationIcon: {
    color: '#DB00FF',
    marginRight: 8,
  },
  locationIconLight: {
    color: '#909090',
    marginRight: 8,
  },
  locationText: {
    color: '#000',
  },
  locationTextLight: {
    color: '#868788',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingLeft: 5,
    paddingRight: 15,
    paddingBottom: 20,
  },
  ctrl: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inactive: {
    color: '#888',
  },
})
