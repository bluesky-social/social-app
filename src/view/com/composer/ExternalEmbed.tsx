import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {BlurView} from '../util/BlurView'
import LinearGradient from 'react-native-linear-gradient'
import {AutoSizedImage} from '../util/images/AutoSizedImage'
import {Text} from '../util/text/Text'
import {s, gradients} from '../../lib/styles'
import {usePalette} from '../../lib/hooks/usePalette'
import {ExternalEmbedDraft} from '../../../state/lib/api'

export const ExternalEmbed = ({
  link,
  onRemove,
}: {
  link?: ExternalEmbedDraft
  onRemove: () => void
}) => {
  const pal = usePalette('default')
  const palError = usePalette('error')
  if (!link) {
    return <View />
  }
  return (
    <View style={[styles.outer, pal.view, pal.border]}>
      {link.isLoading ? (
        <View
          style={[
            styles.image,
            styles.imageFallback,
            {backgroundColor: pal.colors.backgroundLight},
          ]}>
          <ActivityIndicator size="large" style={styles.spinner} />
        </View>
      ) : link.localThumb ? (
        <AutoSizedImage
          uri={link.localThumb.path}
          containerStyle={styles.image}
        />
      ) : (
        <LinearGradient
          colors={[gradients.blueDark.start, gradients.blueDark.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.image, styles.imageFallback]}
        />
      )}
      <TouchableWithoutFeedback onPress={onRemove}>
        <BlurView style={styles.removeBtn} blurType="dark">
          <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
        </BlurView>
      </TouchableWithoutFeedback>
      <View style={styles.inner}>
        {!!link.meta?.title && (
          <Text type="sm-bold" numberOfLines={2} style={[pal.text]}>
            {link.meta.title}
          </Text>
        )}
        <Text type="sm" numberOfLines={1} style={[pal.textLight, styles.uri]}>
          {link.uri}
        </Text>
        {!!link.meta?.description && (
          <Text
            type="sm"
            numberOfLines={2}
            style={[pal.text, styles.description]}>
            {link.meta.description}
          </Text>
        )}
        {!!link.meta?.error && (
          <Text
            type="sm"
            numberOfLines={2}
            style={[{color: palError.colors.background}, styles.description]}>
            {link.meta.error}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 20,
  },
  inner: {
    padding: 10,
  },
  image: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    height: 200,
  },
  imageFallback: {
    height: 160,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 60,
  },
  uri: {
    marginTop: 2,
  },
  description: {
    marginTop: 4,
  },
})
