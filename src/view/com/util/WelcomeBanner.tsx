import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from './text/Text'
import {Button} from './forms/Button'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {SUGGESTED_FOLLOWS} from 'lib/constants'

export const WelcomeBanner = observer(() => {
  const pal = usePalette('default')
  const store = useStores()

  const numFollows = Math.min(
    SUGGESTED_FOLLOWS(String(store.agent.service)).length,
    5,
  )
  const remaining = numFollows - store.me.follows.numFollows
  const onPressDone = React.useCallback(() => {
    store.shell.setOnboarding(false)
  }, [store])

  return (
    <View
      testID="welcomeBanner"
      style={[pal.view, styles.container, pal.border]}>
      <Text
        type="title-lg"
        style={[pal.text, s.textCenter, s.bold, s.pb5]}
        lineHeight={1.1}>
        Welcome to the private beta!
      </Text>
      {store.me.follows.numFollows >= numFollows ? (
        <View style={styles.controls}>
          <Button
            type="primary"
            style={[s.flexRow, s.alignCenter]}
            onPress={onPressDone}>
            <Text type="md-bold" style={s.white}>
              See my feed!
            </Text>
            <FontAwesomeIcon icon="angle-right" size={14} style={s.white} />
          </Button>
        </View>
      ) : (
        <Text type="lg" style={[pal.text, s.textCenter]}>
          Follow at least {remaining} {remaining === 1 ? 'person' : 'people'} to
          build your feed.
        </Text>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
})
