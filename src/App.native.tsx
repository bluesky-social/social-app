import * as React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import Animated, {useAnimatedScrollHandler} from 'react-native-reanimated'

export default function App() {
  const [x, setX] = React.useState(0)
  React.useEffect(() => {
    let id = setInterval(() => setX(x => x + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handler = useAnimatedScrollHandler({
    onScroll() {
      console.log(x)
    },
  })

  return <Child onScroll={handler} />
}

const Child = observer(function ({onScroll}) {
  return (
    <View style={{flex: 1, flexDirection: 'row'}}>
      <Animated.FlatList
        onScroll={onScroll}
        style={{flex: 1, backgroundColor: 'red'}}
        contentContainerStyle={{
          paddingTop: 1000,
        }}
      />
    </View>
  )
})
