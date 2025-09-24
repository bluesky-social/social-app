import {useState} from 'react'
import {View} from 'react-native'
import {runOnJS} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {ScrollProvider} from '#/lib/ScrollContext'
import {List as OldList} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {List, ListScrollProvider, useListScrollHandler} from '#/components/List'
import {Text} from '#/components/Typography'

export function StorybookLists() {
  return <Inner />
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

function Header() {
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

export function Inner() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [old, setOld] = useState<boolean>(false)
  const onScrollWorklet = useListScrollHandler(e => {
    'worklet'
    runOnJS(log)(`scroll ${e.contentOffset.y}`)
  }, [])

  return (
    <View style={[]}>
      <View
        style={[a.fixed, a.w_full, a.py_sm, a.px_xl, a.align_center, a.z_10]}>
        <Button
          label="Toggle Old/New List"
          onPress={() => setOld(v => !v)}
          size="tiny"
          color="primary_subtle">
          <ButtonText>
            {old ? 'Testing old List' : 'Testing new List'}
          </ButtonText>
        </Button>
      </View>

      {!old ? (
        <ListScrollProvider onScroll={onScrollWorklet}>
          <List<Item>
            data={items}
            headerOffset={insets.top}
            stickyHeaderOffset={52}
            StickyHeaderComponent={Header}
            onScrolledDownChange={scrolledDown => {
              console.log(`Scrolled down: ${scrolledDown}`)
            }}
            renderItem={({item, index}) => (
              <Layout.Center>
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
              </Layout.Center>
            )}
            style={[a.debug]}
          />
        </ListScrollProvider>
      ) : (
        <ScrollProvider onScroll={onScrollWorklet}>
          <OldList
            data={items}
            keyExtractor={item => item.key}
            headerOffset={100}
            onScrolledDownChange={scrolledDown => {
              console.log(`Scrolled down: ${scrolledDown}`)
            }}
            renderItem={({item}) => (
              <View style={[a.p_md, a.border_b]}>
                <Text>{item.title}</Text>
              </View>
            )}
            style={[a.debug]}
            desktopFixedHeight
          />
        </ScrollProvider>
      )}
    </View>
  )
}
