import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AutoSizedImage} from '../util/images/AutoSizedImage'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {ExternalEmbedDraft} from 'lib/api/index'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export const ExternalEmbed = ({
  link,
  onRemove,
}: {
  link?: ExternalEmbedDraft
  onRemove: () => void
}) => {
  const pal = usePalette('default')
  const palError = usePalette('error')
  const {_} = useLingui()
  if (!link) {
    return <View />
  }
  return (
    <View style={[styles.outer, pal.view, pal.border]}>
      {link.isLoading ? (
        <View
          style={[styles.image, {backgroundColor: pal.colors.backgroundLight}]}>
          <ActivityIndicator size="large" style={styles.spinner} />
        </View>
      ) : link.localThumb ? (
        <AutoSizedImage uri={link.localThumb.path} style={styles.image} />
      ) : undefined}
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
        {link.meta?.error ? (
          <Text
            type="sm"
            numberOfLines={2}
            style={[{color: palError.colors.background}, styles.description]}>
            {link.meta.error}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Remove image preview`)}
        accessibilityHint={_(msg`Removes default thumbnail from ${link.uri}`)}
        onAccessibilityEscape={onRemove}>
        <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  inner: {
    padding: 10,
  },
  image: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    maxHeight: 200,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
