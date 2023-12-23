import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyEmbedImages} from '@atproto/api'
import {ViewerImage} from 'view/com/imageviewer'

interface IProps {
  images: AppBskyEmbedImages.ViewImage[]
  style?: StyleProp<ViewStyle>
}

export function ImageLayoutGrid({images, style}: IProps) {
  return (
    <View style={style}>
      <View style={styles.container}>
        <ImageLayoutGridInner images={images} />
      </View>
    </View>
  )
}

function ImageLayoutGridInner({images}: Omit<IProps, 'style'>) {
  const count = images.length

  switch (count) {
    case 2:
      return (
        <View style={styles.flexRow}>
          <View style={styles.smallItem}>
            <ViewerImage images={images} index={0} imageStyle={styles.image} />
          </View>
          <View style={styles.smallItem}>
            <ViewerImage images={images} index={1} imageStyle={styles.image} />
          </View>
        </View>
      )

    case 3:
      return (
        <View style={styles.flexRow}>
          <View style={{flex: 2, aspectRatio: 1}}>
            <ViewerImage images={images} index={0} imageStyle={styles.image} />
          </View>
          <View style={{flex: 1}}>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={1}
                imageStyle={styles.image}
              />
            </View>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={2}
                imageStyle={styles.image}
              />
            </View>
          </View>
        </View>
      )

    case 4:
      return (
        <>
          <View style={styles.flexRow}>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={0}
                imageStyle={styles.image}
              />
            </View>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={1}
                imageStyle={styles.image}
              />
            </View>
          </View>
          <View style={styles.flexRow}>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={2}
                imageStyle={styles.image}
              />
            </View>
            <View style={styles.smallItem}>
              <ViewerImage
                images={images}
                index={3}
                imageStyle={styles.image}
              />
            </View>
          </View>
        </>
      )

    default:
      return null
  }
}

// This is used to compute margins (rather than flexbox gap) due to Yoga bugs:
// https://github.com/facebook/yoga/issues/1418
const IMAGE_GAP = 5

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -IMAGE_GAP / 2,
    marginVertical: -IMAGE_GAP / 2,
  },
  flexRow: {flexDirection: 'row'},
  smallItem: {flex: 1, aspectRatio: 1},
  image: {
    margin: IMAGE_GAP / 2,
  },
})
