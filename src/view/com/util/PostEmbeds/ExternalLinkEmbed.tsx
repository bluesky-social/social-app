import React from 'react'
import {Text} from '../text/Text'
import {Image} from '../images/Image'
import {StyleSheet, View} from 'react-native'
import {usePalette} from '../../../lib/hooks/usePalette'

const ExternalLinkEmbed = ({link, onImagePress}) => {
  const pal = usePalette('default')
  return (
    <>
      {link.thumb ? (
        <Image
          uri={link.thumb}
          style={styles.extImage}
          onPress={onImagePress}
        />
      ) : undefined}
      <View style={styles.extInner}>
        <Text type="md-bold" numberOfLines={2} style={[pal.text]}>
          {link.title || link.uri}
        </Text>
        <Text
          type="sm"
          numberOfLines={1}
          style={[pal.textLight, styles.extUri]}>
          {link.uri}
        </Text>
        {link.description ? (
          <Text
            type="sm"
            numberOfLines={2}
            style={[pal.text, styles.extDescription]}>
            {link.description}
          </Text>
        ) : undefined}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  extInner: {
    padding: 10,
  },
  extImage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
    maxHeight: 200,
  },
  extUri: {
    marginTop: 2,
  },
  extDescription: {
    marginTop: 4,
  },
})

export default ExternalLinkEmbed
