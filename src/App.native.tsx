import {useState} from 'react'
import {ScrollView, Text, View} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

export default function App() {
  const val = useSharedValue(0)
  const [swipeEnabled, setSwipeEnabled] = useState(true)

  let pan = Gesture.Pan()
    .onBegin(() => {
      'worklet'
      console.log('begin')
      val.set(0)
    })
    .onUpdate(e => {
      'worklet'
      console.log('update')
      val.set(e.translationX)
    })
    .onEnd(() => {
      'worklet'
      console.log('end')
      val.set(0)
    })
    .onFinalize(() => {
      'worklet'
      console.log('finalize')
      val.set(0)
    })

  if (swipeEnabled) {
    pan = pan.failOffsetX(-1).activeOffsetX(5)
  } else {
    pan = pan.failOffsetX([0, 0]).failOffsetY([0, 0])
  }

  const style = useAnimatedStyle(() => {
    return {
      flex: 1,
      transform: [
        {
          translateX: val.value,
        },
      ],
    }
  })
  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={pan}>
        <Animated.View style={style}>
          <Pager pan={pan} setSwipeEnabled={setSwipeEnabled}>
            <InnerScrollView pan={pan} />
          </Pager>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

function Pager({children, pan, setSwipeEnabled}) {
  const native = Gesture.Native().requireExternalGestureToFail(pan)
  return (
    <GestureDetector gesture={native}>
      <PagerView
        overdrag={true}
        initialPage={0}
        style={{
          flex: 1,
          backgroundColor: 'green',
        }}
        onPageSelected={e => {
          setSwipeEnabled(e.nativeEvent.position === 0)
        }}>
        {children}
        {children}
        {children}
      </PagerView>
    </GestureDetector>
  )
}

function InnerScrollView({pan}) {
  const native = Gesture.Native().blocksExternalGesture(pan)
  return (
    <View
      style={{
        paddingTop: 200,
        alignItems: 'center',
      }}>
      <GestureDetector gesture={native}>
        <ScrollView
          horizontal
          pagingEnabled
          style={{
            width: 300,
            backgroundColor: 'yellow',
            height: 200,
          }}>
          <Text
            style={{
              width: 1000,
            }}>
            1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26
            27 28 29 30 31 32 33 34 35 36 37 38 39 40
          </Text>
        </ScrollView>
      </GestureDetector>
    </View>
  )
}
