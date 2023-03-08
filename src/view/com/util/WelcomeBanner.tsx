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
// @ts-ignore no type definition -prf
import ProgressBar from 'react-native-progress/Bar'

export const WelcomeBanner = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const [isReady, setIsReady] = React.useState(false)

  const numFollows = Math.min(
    SUGGESTED_FOLLOWS(String(store.agent.service)).length,
    5,
  )
  const remaining = numFollows - store.me.follows.numFollows

  React.useEffect(() => {
    if (remaining <= 0) {
      // wait 500ms for the progress bar anim to finish
      const ti = setTimeout(() => {
        setIsReady(true)
      }, 500)
      return () => clearTimeout(ti)
    } else {
      setIsReady(false)
    }
  }, [remaining])

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
        Welcome to Bluesky!
      </Text>
      {isReady ? (
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
        <>
          <Text type="lg" style={[pal.text, s.textCenter]}>
            Follow at least {remaining} {remaining === 1 ? 'person' : 'people'}{' '}
            to build your feed.
          </Text>
          <View style={[styles.controls, styles.progress]}>
            <ProgressBar
              progress={Math.max(
                store.me.follows.numFollows / numFollows,
                0.05,
              )}
            />
          </View>
        </>
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
  progress: {
    marginTop: 12,
  },
})
