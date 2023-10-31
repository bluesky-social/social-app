import React, {useState} from 'react'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {Image, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AutoSizedImage, FullAxis} from 'view/com/util/images/AutoSizedImage'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Link, openLink} from 'view/com/util/Link'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {getIcon} from 'lib/waverly/websiteIcon'

const FAVICON_SIZE = 32

interface Props {
  embedInfo: EmbedInfo
  containerStyle?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ViewStyle>
  portraitExtraStyle?: StyleProp<ViewStyle>
  fullAxis?: FullAxis
  postUri?: string
}

export const EmbedBlock = ({
  embedInfo,
  containerStyle,
  imageStyle,
  portraitExtraStyle,
  fullAxis,
  postUri,
}: Props) => {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  const [favIconError, setFavIconError] = useState(false)

  if (embedInfo.type === 'none') return <></>

  const imageLink =
    (embedInfo.type === 'youtube' && embedInfo.link?.uri) || postUri

  const imageBlock = embedInfo.image && (
    <AutoSizedImage
      onPress={
        imageLink ? () => openLink(store, navigation, imageLink) : undefined
      }
      uri={embedInfo.image.uri}
      alt={embedInfo.image.alt}
      style={[styles.image, imageStyle]}
      portraitExtraStyle={portraitExtraStyle}
      fullAxis={fullAxis}>
      {embedInfo.type === 'youtube' && (
        <FontAwesomeIcon
          icon="play"
          size={64}
          color="white"
          style={[s.absolute]}
        />
      )}
    </AutoSizedImage>
  )

  if (embedInfo.type === 'image' || embedInfo.type === 'youtube') {
    if (!imageBlock)
      throw new Error('EmbedBlock of type image or youtube, but missing image')
    return imageBlock
  }

  const host = embedInfo.link?.host
  const length = embedInfo.link?.length && embedInfo.link?.length + ' read'

  if (!embedInfo.quote) {
    return (
      <Link
        style={[styles.container, containerStyle, pal.viewLight]}
        href={embedInfo.link?.uri}
        noFeedback>
        {imageBlock}
        <View style={styles.title}>
          {embedInfo.link?.title && (
            <Text type="sm" numberOfLines={2} style={pal.text}>
              {embedInfo.link.title}
            </Text>
          )}
          {(host || length) && (
            <View style={styles.details}>
              {host && (
                <Text type="sm" style={pal.text}>
                  {host}
                </Text>
              )}
              {host && length && (
                <Text type="sm" style={pal.text}>
                  •
                </Text>
              )}
              {length && (
                <Text type="sm" style={pal.text}>
                  {length}
                </Text>
              )}
            </View>
          )}
        </View>
      </Link>
    )
  } else {
    return (
      <Link
        style={[styles.container, containerStyle, styles.quoteContainer]}
        href={embedInfo.link?.uri}
        noFeedback>
        <>
          {imageBlock}
          <View style={styles.outerQuoteBlock}>
            <View style={styles.innerQuoteBlock_Upper}>
              <View style={[styles.verticalLine]} />
              <Text type={'sm-medium'} style={(pal.text, styles.quoteText)}>
                {embedInfo.quote}
              </Text>
            </View>
            <View style={styles.innerQuoteBlock_Lower}>
              {embedInfo.link && !favIconError ? (
                <Image
                  accessibilityLabel="Source favicon"
                  accessibilityHint="Source favicon"
                  accessibilityIgnoresInvertColors={false}
                  style={styles.favicon}
                  onError={() => setFavIconError(true)}
                  source={{
                    uri: getIcon(embedInfo.link.originalUri),
                  }}
                />
              ) : (
                <FontAwesomeIcon icon="globe" size={FAVICON_SIZE} />
              )}
              <View style={styles.quoteTitle}>
                {embedInfo.link?.title && (
                  <Text type="sm-bold" numberOfLines={1} style={pal.text}>
                    {embedInfo.link.title}
                  </Text>
                )}
                {(host || length) && (
                  <View style={styles.details}>
                    {host && (
                      <Text type="sm" style={pal.text}>
                        {host}
                      </Text>
                    )}
                    {host && length && (
                      <Text type="sm" style={pal.text}>
                        •
                      </Text>
                    )}
                    {length && (
                      <Text type="sm" style={pal.text}>
                        {length}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              <FontAwesomeIcon icon="angle-right" size={20} />
            </View>
          </View>
        </>
      </Link>
    )
  }
}

const styles = StyleSheet.create({
  image: {justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  container: {overflow: 'hidden', marginTop: 8},
  title: {paddingHorizontal: 11, paddingVertical: 16, gap: 8},
  details: {flexDirection: 'row', gap: 4},

  /////////////////////////////////////////////////////////////////////////
  // Styles for embeds with quotes in them.

  quoteTitle: {
    marginLeft: 8,
    gap: 1,
    flex: 1,
  },
  quoteContainer: {
    backgroundColor: '#FCE1DF',
  },

  outerQuoteBlock: {
    flexDirection: 'column',
    padding: 12,
  },
  verticalLine: {
    width: 2,
    backgroundColor: '#000000',
  },
  innerQuoteBlock_Upper: {
    flexDirection: 'row',
    gap: 8,
  },
  innerQuoteBlock_Lower: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quoteText: {
    paddingRight: 16,
    paddingVertical: 2,
    lineHeight: 18,
  },
  favicon: {
    height: FAVICON_SIZE,
    width: FAVICON_SIZE,
    borderRadius: 3,
  },
})
