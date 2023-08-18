import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {useStores} from 'state/index'
import {Text} from 'view/com/util/text/Text'
import {Button} from 'view/com/util/forms/Button'

export const snapPoints = [300]
export const Component = () => {
  const pal = usePalette('default')
  const store = useStores()

  return (
    <View style={[pal.view, styles.container]}>
      <View style={[s.alignCenter]}>
        <FontAwesomeIcon icon="wifi" style={s.white} size={50} />
      </View>
      <Text type="title-lg" style={[s.textCenter, pal.text, s.pb20]}>
        Offline Mode
      </Text>
      <Text style={[pal.text, s.pl20, s.pr20]}>
        BlueSky works best when you're connected to the internet, you can still
        browse around while offline.
      </Text>
      <Text style={[pal.text, s.pl20, s.pr20, s.pt10]}>
        However, you won't be able to post or interact with posts/users until
        you're back online.
      </Text>
      <Button
        type="primary"
        style={styles.btn}
        onPress={() => store.shell.closeModal()}>
        <Text type="button-lg" style={[pal.textLight, s.textCenter, s.white]}>
          Close
        </Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 10,
  },
  btn: {
    marginHorizontal: 15,
    marginTop: 20,
  },
})
