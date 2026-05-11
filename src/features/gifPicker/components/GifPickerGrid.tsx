import {forwardRef} from 'react'
import {Platform, useWindowDimensions, View} from 'react-native'

import {cleanError} from '#/lib/strings/errors'
import {type ListMethods} from '#/view/com/util/List'
import {atoms as a, native, useBreakpoints, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {ListFooter} from '#/components/Lists'
import {GifPickerItem} from '#/features/gifPicker/components/GifPickerItem'
import {type Gif} from '#/features/gifPicker/types'

type Props = {
  items: Gif[]
  header: React.ReactNode
  hasData: boolean
  isFetchingNextPage: boolean
  error: unknown
  fetchNextPage: () => Promise<unknown>
  onEndReached: () => void
  onSelectGif: (gif: Gif) => void
}

export const GifPickerGrid = forwardRef<ListMethods, Props>(
  function GifPickerGrid(
    {
      items,
      header,
      hasData,
      isFetchingNextPage,
      error,
      fetchNextPage,
      onEndReached,
      onSelectGif,
    },
    ref,
  ) {
    const {gtMobile} = useBreakpoints()
    const {height} = useWindowDimensions()
    const numColumns = gtMobile ? 3 : 2

    const columns = distributeIntoColumns(items, numColumns)

    /**
     * The grid is a single FlatList row because the tiles are distributed
     * into columns up front for masonry. `onEndReached` still fires against
     * the outer FlatList's scroll position, so pagination behaves the same
     * as a conventional grid.
     */
    const data = hasData ? [columns] : []

    return (
      <Dialog.InnerFlatList
        ref={ref}
        key={String(numColumns)}
        data={data}
        renderItem={({item}: {item: Gif[][]}) => (
          <View style={[a.flex_row, a.gap_sm]}>
            {item.map((column, i) => (
              <View key={i} style={[a.flex_1, a.gap_sm, {minWidth: 0}]}>
                {column.map(gif => (
                  <GifPickerItem
                    key={gif.id}
                    gif={gif}
                    onSelectGif={onSelectGif}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(_item, index) => `masonry-${index}`}
        contentContainerStyle={[native([a.px_xl, {minHeight: height}])]}
        webInnerStyle={[web({minHeight: '80vh'})]}
        webInnerContentContainerStyle={[web(a.pb_0)]}
        ListHeaderComponent={<>{header}</>}
        stickyHeaderIndices={[0]}
        onEndReached={onEndReached}
        onEndReachedThreshold={1}
        // On web, "on-drag" blurs the focused input on ANY scroll event,
        // including programmatic scrolls (e.g., content shrinking when search
        // results swap in). That breaks search-while-scrolled — the blur fires
        // mid-typing and subsequent keystrokes go nowhere.
        keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        ListFooterComponent={
          hasData ? (
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
              style={{borderTopWidth: 0}}
            />
          ) : null
        }
      />
    )
  },
)

/**
 * Walks `items` in order and pushes each one into the currently shortest
 * column, tracking accumulated height-per-unit-width from each GIF's
 * intrinsic aspect ratio. Preserves ordering top-to-bottom within each
 * column, which keeps pagination behavior intuitive as new pages stream in.
 */
function distributeIntoColumns(items: Gif[], numColumns: number): Gif[][] {
  const columns: Gif[][] = Array.from({length: numColumns}, () => [])
  const heights = new Array(numColumns).fill(0)

  for (const item of items) {
    const [w, h] = item.media_formats.tinygif.dims
    const ratio = w > 0 && h > 0 ? h / w : 1

    let shortest = 0
    for (let i = 1; i < numColumns; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(item)
    heights[shortest] += ratio
  }

  return columns
}
