import * as React from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedScrollHandler} from 'react-native-reanimated'

export default function App() {
  function someWorkletFn() {
    'worklet'
    console.log('lol')
  }

  const [x, setX] = React.useState(0)

  const handler = useAnimatedScrollHandler({
    onScroll() {
      console.log(x)
      someWorkletFn()
    },
  })

  React.useEffect(() => {
    let id = setInterval(() => setX(x => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Animated.FlatList
      onScroll={handler}
      style={{flex: 1, backgroundColor: 'red'}}
      contentContainerStyle={{
        paddingTop: 1000,
      }}
    />
  )
}
