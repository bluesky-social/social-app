import React from 'react'
import {observer} from 'mobx-react-lite'
import {PostsFeedSliceModel} from 'state/models/feeds/posts-slice'
import {StyleSheet, View} from 'react-native'
import {ImageLayoutGrid} from '../util/images/ImageLayoutGrid'

export const MediaSlice = observer(function FeedSliceImpl({
  slice,
  ignoreFilterFor,
}: {
  slice: PostsFeedSliceModel
  ignoreFilterFor?: string
}) {
  console.log('HIHIHI')
  if (slice.shouldFilter(ignoreFilterFor)) {
    return null
  }

  const openLightbox = (index: number) => {
    console.log('Index: ', index)
  }

  const onPressIn = (index: number) => {
    console.log('Index: ', index)
  }
  console.log('Trying')
  if (slice.items.length > 0) {
    console.log('Fuck me')
    console.log('***')
    console.log(slice.items)
    console.log('^^^^')
  }
  return (
    <View style={[styles.imagesContainer, undefined]}>
      <ImageLayoutGrid
        images={[]}
        onPress={openLightbox}
        onPressIn={onPressIn}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  imagesContainer: {
    marginTop: 8,
  },

  singleImage: {
    borderRadius: 8,
    maxHeight: 1000,
  },
})
