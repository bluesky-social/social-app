import React from 'react'
import {observer} from 'mobx-react-lite'
// import {PostsFeedSliceModel} from 'state/models/feeds/posts-slice'
import {StyleSheet, View} from 'react-native'
import {ImageLayoutGrid} from '../util/images/ImageLayoutGrid'

export const MediaSlice = observer(function FeedSliceImpl({
  slice,
  ignoreFilterFor,
}: {
  slice: any
  ignoreFilterFor?: string
}) {
  // if (slice.shouldFilter(ignoreFilterFor)) {
  //   return null
  // }

  const openLightbox = (index: number) => {
    console.log('IgnoreFilterFor', ignoreFilterFor)
    console.log('Index: ', index)
  }

  const onPressIn = (index: number) => {
    console.log('Index: ', index)
  }

  return (
    <View style={[styles.imagesContainer, undefined]}>
      <ImageLayoutGrid
        images={slice}
        onPress={openLightbox}
        onPressIn={onPressIn}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  imagesContainer: {},

  singleImage: {
    borderRadius: 8,
    maxHeight: 1000,
  },
})
