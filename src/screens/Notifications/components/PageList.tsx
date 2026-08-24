import {View} from 'react-native'

import {List} from '#/view/com/util/List'
import {MainScrollProvider} from '#/view/com/util/MainScrollProvider'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

const ITEMS = Array.from({length: 50}, (_, index) => String(index + 1))

export function PageList({
  pageIndex,
  headerOffset,
}: {
  pageIndex: number
  headerOffset: number
}) {
  const t = useTheme()

  return (
    <MainScrollProvider>
      <List
        style={a.flex_1}
        headerOffset={headerOffset}
        {...(IS_WEB ? {disableFullWindowScroll: true} : {})}
        data={ITEMS}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
            <Text>{`${pageIndex + 1}.${item}`}</Text>
          </View>
        )}
      />
    </MainScrollProvider>
  )
}
