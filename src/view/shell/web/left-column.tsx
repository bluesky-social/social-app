import React from 'react'
import {View} from 'react-native'

// export const NavItem: React.FC<{label: string; screen: string}> = ({
//   label,
//   screen,
// }) => {
//   const Link = <></> // TODO
//   return (
//     <View>
//       <Pressable
//         style={state => [
//           // @ts-ignore it does exist! (react-native-web) -prf
//           state.hovered && styles.navItemHovered,
//         ]}>
//         <Link
//           style={[
//             styles.navItemLink,
//             false /* TODO route.name === screen*/ && styles.navItemLinkSelected,
//           ]}
//           to={{screen, params: {}}}>
//           {label}
//         </Link>
//       </Pressable>
//     </View>
//   )
// }

export const DesktopLeftColumn: React.FC = () => {
  // TODO
  return <View />
  // return (
  //   <View style={styles.container}>
  //     <NavItem screen="Home" label="Home" />
  //     <NavItem screen="Search" label="Search" />
  //     <NavItem screen="Notifications" label="Notifications" />
  //   </View>
  // )
}

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     left: 'calc(50vw - 500px)',
//     width: '200px',
//     height: '100%',
//   },
//   navItemHovered: {
//     backgroundColor: 'gray',
//   },
//   navItemLink: {
//     padding: '1rem',
//   },
//   navItemLinkSelected: {
//     color: 'blue',
//   },
// })
