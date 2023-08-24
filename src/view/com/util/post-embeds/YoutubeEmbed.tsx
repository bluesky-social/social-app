import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ExternalLinkEmbed} from './ExternalLinkEmbed'
import {AppBskyEmbedExternal} from '@atproto/api'
import {Link} from '../Link'

export const YoutubeEmbed = ({
  link,
  style,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  style?: StyleProp<ViewStyle>
}) => {
  const pal = usePalette('default')

  const imageChild = (
    <View style={styles.playButton}>
      <FontAwesomeIcon icon="play" size={24} color="white" />
    </View>
  )

  return (
    <Link
      asAnchor
      style={[styles.extOuter, pal.view, pal.border, style]}
      href={link.uri}>
      <ExternalLinkEmbed link={link} imageChild={imageChild} />
    </Link>
  )
}

const styles = StyleSheet.create({
  extOuter: {
    borderWidth: 1,
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    top: '44%',
    justifyContent: 'center',
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
    opacity: 0.8,
  },
  webView: {
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
})
