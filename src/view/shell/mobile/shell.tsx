import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  GestureResponderEvent,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {useStores} from '../../../state'
import {match} from '../../routes'

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
          style={[styles.icon, styles.inactive]}
          icon={icon}
        />
      </View>
    )
  }
  return (
    <TouchableOpacity style={styles.ctrl} onPress={onPress}>
      <FontAwesomeIcon size={18} style={styles.icon} icon={icon} />
    </TouchableOpacity>
  )
}

export const MobileShell: React.FC = observer(() => {
  const stores = useStores()
  const onPressBack = () => stores.nav.tab.goBack()
  const onPressForward = () => stores.nav.tab.goForward()
  const onPressHome = () => stores.nav.navigate('/')
  const {Com, params} = match(stores.nav.tab.current.url)
  return (
    <View style={styles.outerContainer}>
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
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inactive: {
    color: '#888',
  },
})
