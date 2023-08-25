import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {ComposePost} from '../com/composer/Composer'
import {ComposerOpts} from 'state/models/ui/shell'
import {usePalette} from 'lib/hooks/usePalette'
import {isMobileWeb} from 'platform/detection'

const BOTTOM_BAR_HEIGHT = 61

export const Composer = observer(
  ({
    active,
    replyTo,
    quote,
    onPost,
    onClose,
    mention,
  }: {
    active: boolean
    winHeight: number
    replyTo?: ComposerOpts['replyTo']
    quote: ComposerOpts['quote']
    onPost?: ComposerOpts['onPost']
    onClose: () => void
    mention?: ComposerOpts['mention']
  }) => {
    const pal = usePalette('default')

    // rendering
    // =

    if (!active) {
      return <View />
    }

    return (
      <View style={styles.mask} aria-modal accessibilityViewIsModal>
        <View style={[styles.container, pal.view, pal.border]}>
          <ComposePost
            replyTo={replyTo}
            quote={quote}
            onPost={onPost}
            onClose={onClose}
            mention={mention}
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
  },
  container: {
    marginTop: 50,
    maxWidth: 600,
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 2,
    borderRadius: isMobileWeb ? 0 : 8,
    marginBottom: isMobileWeb ? BOTTOM_BAR_HEIGHT : 0,
    borderWidth: 1,
    maxHeight: isMobileWeb
      ? `calc(100% - ${BOTTOM_BAR_HEIGHT}px)`
      : 'calc(100% - (40px * 2))',
  },
})
