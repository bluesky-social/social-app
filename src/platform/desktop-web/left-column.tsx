import React from 'react'
import {Pressable, View, StyleSheet} from 'react-native'
import {Link} from '@react-navigation/native'
import {useRoute} from '@react-navigation/native'

export const NavItem: React.FC<{label: string; screen: string}> = ({
  label,
  screen,
}) => {
  const route = useRoute()
  return (
    <View>
      <Pressable
        style={state => [
          // @ts-ignore it does exist! (react-native-web) -prf
          state.hovered && styles.navItemHovered,
        ]}>
        <Link
          style={[
            styles.navItemLink,
            route.name === screen && styles.navItemLinkSelected,
          ]}
          to={{screen, params: {}}}>
          {label}
        </Link>
      </Pressable>
    </View>
  )
}

export const DesktopLeftColumn: React.FC = () => {
  return (
    <View style={styles.container}>
      <NavItem screen="Home" label="Home" />
      <NavItem screen="Search" label="Search" />
      <NavItem screen="Notifications" label="Notifications" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 'calc(50vw - 500px)',
    width: '200px',
    height: '100%',
  },
  navItemHovered: {
    backgroundColor: 'gray',
  },
  navItemLink: {
    padding: '1rem',
  },
  navItemLinkSelected: {
    color: 'blue',
  },
})
