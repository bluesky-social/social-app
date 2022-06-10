import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import {DesktopLeftColumn} from './left-column'
import {DesktopRightColumn} from './right-column'
import {useStores} from '../../state'

export const DesktopWebShell: React.FC = observer(({children}) => {
  const store = useStores()
  return (
    <View style={styles.outerContainer}>
      {store.session.isAuthed ? (
        <>
          <DesktopLeftColumn />
          <View style={styles.innerContainer}>{children}</View>
          <DesktopRightColumn />
        </>
      ) : (
        <View style={styles.innerContainer}>{children}</View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  outerContainer: {
    height: '100%',
  },
  innerContainer: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '600px',
    height: '100%',
  },
})
