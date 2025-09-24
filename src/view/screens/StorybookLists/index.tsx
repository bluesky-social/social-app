import {View} from 'react-native'
import {runOnJS} from 'react-native-reanimated'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListScrollProvider, useListScrollHandler} from '#/components/List'
import {Text} from '#/components/Typography'

export function StorybookLists() {
  return (
    <Layout.Screen>
      <Inner />
    </Layout.Screen>
  )
}

type Item =
  | {
      key: string
      type: 'item'
      title: string
    }
  | {
      key: string
      type: 'header'
      title: string
    }
  | {
      key: string
      type: 'spacer'
    }

const log = (msg: any) => console.log(msg)

export function Inner() {
  const t = useTheme()
  const onScrollWorklet = useListScrollHandler(e => {
    'worklet'
    runOnJS(log)(`scroll ${e.contentOffset.y}`)
  }, [])

  const items: Item[] = Array.from({length: 1000}).map((_, i) => ({
    key: `item-${i + 1}`,
    type: 'item' as const,
    title: `Item ${i + 1}`,
  }))

  items.unshift({
    key: 'header',
    type: 'header' as const,
    title: 'Header',
  })

  items.unshift({
    key: 'spacer',
    type: 'spacer' as const,
  })

  return (
    <ListScrollProvider onScroll={onScrollWorklet}>
      <Layout.List<Item>
        windowSize={9}
        maxToRenderPerBatch={5}
        data={items}
        stickyHeaderIndices={[1]}
        renderItem={({item, index}) => {
          if (item.type === 'header') {
            return (
              <Layout.Header.Outer>
                <Layout.Header.BackButton />
                <Layout.Header.Content>
                  <Layout.Header.TitleText>Storybook</Layout.Header.TitleText>
                </Layout.Header.Content>
                <Layout.Header.Slot />
              </Layout.Header.Outer>
            )
          }
          if (item.type === 'spacer') {
            return <View style={[t.atoms.bg_contrast_50, {height: 100}]} />
          }

          return (
            <View
              style={[
                a.px_md,
                a.align_center,
                a.justify_center,
                {height: 100},
                index % 2 === 0 ? t.atoms.bg_contrast_25 : t.atoms.bg,
              ]}>
              <Text>{item.title}</Text>
            </View>
          )
        }}
        onScrolledDownChange={scrolledDown => {
          console.log(`Scrolled down: ${scrolledDown}`)
        }}
      />
    </ListScrollProvider>
  )
}
