import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ScrollView} from '../com/util/Views'
import {observer} from 'mobx-react-lite'
import {ScreenParams} from '../routes'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {WhoToFollow} from '../com/discover/WhoToFollow'
import {SuggestedPosts} from '../com/discover/SuggestedPosts'
import {usePalette} from 'lib/hooks/usePalette'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'

const FIVE_MIN = 5 * 60 * 1e3

export const Search = observer(({navIdx, visible}: ScreenParams) => {
  const pal = usePalette('default')
  const store = useStores()
  const scrollElRef = React.useRef<ScrollView>(null)
  const onMainScroll = useOnMainScroll(store)
  const [lastRenderTime, setRenderTime] = React.useState<number>(Date.now()) // used to trigger reloads

  const onSoftReset = () => {
    scrollElRef.current?.scrollTo({x: 0, y: 0})
  }

  React.useEffect(() => {
    const softResetSub = store.onScreenSoftReset(onSoftReset)
    const cleanup = () => {
      softResetSub.remove()
    }

    if (visible) {
      const now = Date.now()
      if (now - lastRenderTime > FIVE_MIN) {
        setRenderTime(Date.now()) // trigger reload of suggestions
      }
      store.shell.setMinimalShellMode(false)
      store.nav.setTitle(navIdx, 'Search')
    }
    return cleanup
  }, [store, visible, navIdx, lastRenderTime])

  return (
    <ScrollView
      ref={scrollElRef}
      testID="searchScrollView"
      style={[pal.view, styles.container]}
      onScroll={onMainScroll}
      scrollEventThrottle={100}>
      <WhoToFollow key={`wtf-${lastRenderTime}`} />
      <SuggestedPosts key={`sp-${lastRenderTime}`} />
      <View style={s.footerSpacer} />
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    marginBottom: 14,
  },
  headerMenuBtn: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
  },
  headerCancelBtn: {
    width: 60,
    paddingLeft: 10,
  },

  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },
})
