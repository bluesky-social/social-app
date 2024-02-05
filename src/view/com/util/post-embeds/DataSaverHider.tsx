import React from 'react'
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../text/Text'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {useDataSaverEnabled} from '#/state/preferences'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Image} from 'expo-image'
import {isWeb} from '#/platform/detection'

const enum State {
  // Warning is shown, but we're checking if we've cached this image
  UNKNOWN,
  // Warning is shown
  HIDDEN,
  // Warning is shown, but we're currently loading the images
  LOADING,
  // The images are shown
  SHOWN,
}

async function isImageCached(uri: string) {
  if (isWeb) {
    const img = document.createElement('img')
    img.src = uri

    const complete = img.complete
    // Set src to empty string immediately so the browser doesn't continue
    // sending out the request.
    img.src = ''

    return complete
  }

  const path = await Image.getCachePathAsync(uri)
  return path !== null
}

export function DataSaverHider({
  testID,
  thumbs,
  children,
}: React.PropsWithChildren<{
  testID?: string
  thumbs: string[]
}>) {
  const dataSaverEnabled = useDataSaverEnabled()
  const [state, setState] = React.useState(
    !dataSaverEnabled ? State.SHOWN : State.UNKNOWN,
  )

  const pal = usePalette('default')
  const {_} = useLingui()

  React.useEffect(() => {
    let aborted = false

    if (state === State.UNKNOWN) {
      // We don't want to show the warning if we're certain we've seen them
      // before, so let's check if they are.
      const promises = Promise.all(thumbs.map(i => isImageCached(i)))

      promises.then(results => {
        if (aborted) {
          return
        }

        const valid = results.every(cached => cached)
        setState(valid ? State.SHOWN : State.HIDDEN)
      })
    }

    if (state === State.LOADING) {
      Image.prefetch(thumbs, 'memory-disk').then(() => {
        if (aborted) {
          return
        }

        setState(State.SHOWN)
      })
    }

    return () => {
      aborted = true
    }
  }, [thumbs, state])

  if (state === State.SHOWN) {
    return children
  }

  return (
    <View testID={testID} style={[styles.outer]}>
      <Pressable
        onPress={() => {
          setState(State.LOADING)
        }}
        accessibilityRole="button"
        accessibilityHint={_(msg`Show the images`)}
        accessibilityLabel=""
        style={[styles.cover, pal.viewLight]}>
        <FontAwesomeIcon
          icon={['far', 'image']}
          size={16}
          color={pal.colors.textLight}
        />

        <Text type="md" style={[pal.text, styles.text]}>
          <Trans>Contains {thumbs.length} images</Trans>
        </Text>

        {state !== State.LOADING ? (
          <View style={styles.aside}>
            <Text type="lg" style={[pal.link, styles.showText]}>
              <Trans>Show</Trans>
            </Text>
          </View>
        ) : (
          <View style={styles.aside}>
            <ActivityIndicator />
          </View>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  cover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
  },
  text: {
    marginLeft: 8,
  },
  aside: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  showText: {
    lineHeight: 16,
  },
})
