import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {FEEDBACK_FORM_URL} from 'lib/constants'

export const DesktopRightNav = observer(function DesktopRightNav() {
  const pal = usePalette('default')
  return (
    <View style={[styles.rightNav, pal.view]}>
      <DesktopSearch />
      <View style={styles.message}>
        <Text type="md" style={[pal.textLight, styles.messageLine]}>
          Welcome to Bluesky! This is a beta application that's still in
          development.
        </Text>
        <TextLink
          type="md"
          style={pal.link}
          href={FEEDBACK_FORM_URL}
          text="Send feedback"
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  rightNav: {
    position: 'absolute',
    top: 20,
    left: 'calc(50vw + 330px)',
    width: 300,
  },

  message: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  messageLine: {
    marginBottom: 10,
  },
})
