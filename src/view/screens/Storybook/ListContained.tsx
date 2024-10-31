import React from 'react'
import {FlatList, View} from 'react-native'

import {ScrollProvider} from '#/lib/ScrollContext'
import {List} from '#/view/com/util/List'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

export function ListContained() {
  const [animated, setAnimated] = React.useState(false)
  const ref = React.useRef<FlatList>(null)

  const data = React.useMemo(() => {
    return Array.from({length: 100}, (_, i) => ({
      id: i,
      text: `Message ${i}`,
    }))
  }, [])

  return (
    <>
      <View style={{width: '100%', height: 300}}>
        <ScrollProvider
          onScroll={e => {
            'worklet'
            console.log(
              JSON.stringify({
                contentOffset: e.contentOffset,
                layoutMeasurement: e.layoutMeasurement,
                contentSize: e.contentSize,
              }),
            )
          }}>
          <List
            data={data}
            renderItem={item => {
              return (
                <View
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.1)',
                  }}>
                  <Text>{item.item.text}</Text>
                </View>
              )
            }}
            keyExtractor={item => item.id.toString()}
            disableFullWindowScroll={true}
            style={{flex: 1}}
            onStartReached={() => {
              console.log('Start Reached')
            }}
            onEndReached={() => {
              console.log('End Reached (threshold of 2)')
            }}
            onEndReachedThreshold={2}
            ref={ref}
            disableVirtualization={true}
          />
        </ScrollProvider>
      </View>

      <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
        <Toggle.Item
          name="a"
          label="Click me"
          value={animated}
          onChange={() => setAnimated(prev => !prev)}>
          <Toggle.Checkbox />
          <Toggle.LabelText>Animated Scrolling</Toggle.LabelText>
        </Toggle.Item>
      </View>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to End"
        onPress={() => ref.current?.scrollToOffset({animated, offset: 0})}>
        <ButtonText>Scroll to Top</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to End"
        onPress={() => ref.current?.scrollToEnd({animated})}>
        <ButtonText>Scroll to End</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="large"
        label="Scroll to Offset 100"
        onPress={() => ref.current?.scrollToOffset({animated, offset: 500})}>
        <ButtonText>Scroll to Offset 500</ButtonText>
      </Button>
    </>
  )
}
