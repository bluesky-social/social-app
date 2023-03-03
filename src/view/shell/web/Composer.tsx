import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {ComposePost} from '../../com/composer/ComposePost'
import {ComposerOpts} from 'state/models/shell-ui'
import {usePalette} from 'lib/hooks/usePalette'

export const Composer = observer(
  ({
    active,
    replyTo,
    imagesOpen,
    onPost,
    onClose,
  }: {
    active: boolean
    winHeight: number
    replyTo?: ComposerOpts['replyTo']
    imagesOpen?: ComposerOpts['imagesOpen']
    onPost?: ComposerOpts['onPost']
    onClose: () => void
  }) => {
    const pal = usePalette('default')

    // rendering
    // =

    if (!active) {
      return <View />
    }

    return (
      <View style={styles.mask}>
        <View style={[styles.container, pal.view]}>
          <ComposePost
            replyTo={replyTo}
            imagesOpen={imagesOpen}
            onPost={onPost}
            onClose={onClose}
          />
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: 600,
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginBottom: '10vh',
  },
})
