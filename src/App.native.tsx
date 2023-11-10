import * as React from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedScrollHandler} from 'react-native-reanimated'

export default function App() {
  const [x, setX] = React.useState(0)
  React.useEffect(() => {
    let id = setInterval(() => setX(x => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // props to pass into children render functions
  const onScroll = useAnimatedScrollHandler({
    onScroll(e) {
      console.log(x)
    },
  })

  return (
    <View style={{flex: 1, flexDirection: 'row'}}>
      <Animated.FlatList
        onScroll={onScroll}
        style={{flex: 1, backgroundColor: 'red'}}
        contentContainerStyle={{
          paddingTop: 1000,
        }}
      />
      <Animated.FlatList
        onScroll={onScroll}
        style={{flex: 1, backgroundColor: 'blue'}}
        contentContainerStyle={{
          paddingTop: 1000,
        }}
      />
    </View>
  )
}
