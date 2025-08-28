import {View} from 'react-native'
import {runOnJS} from 'react-native-reanimated'

import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {List, ListScrollProvider, useListScrollHandler} from '#/components/List'
import {Text} from '#/components/Typography'

export function StorybookLists() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Storybook</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content keyboardShouldPersistTaps="handled">
        <Inner />
      </Layout.Content>
    </Layout.Screen>
  )
}

const items = Array.from({length: 100}).map((_, i) => ({
  key: `item-${i + 1}`,
  title: `Item ${i + 1}`,
}))

type Item = {
  key: string
  title: string
}

const log = (msg: any) => console.log(msg)

export function Inner() {
  const onScrollWorklet = useListScrollHandler(e => {
    'worklet'
    runOnJS(log)(`Scroll Y: ${e.contentOffset.y}`)
  }, [])

  return (
    <View style={[a.h_full_vh]}>
      <ListScrollProvider onScroll={onScrollWorklet}>
        <List<Item>
          data={items}
          headerOffset={100}
          footerOffset={100}
          renderItem={({item}) => (
            <View style={[a.p_md, a.border_b]}>
              <Text>{item.title}</Text>
            </View>
          )}
          style={[a.debug]}
        />
      </ListScrollProvider>
    </View>
  )
}
