import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {ComposePost} from '../com/composer/Composer'
import {ComposerOpts} from 'state/models/ui/shell'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

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
    const {isMobile} = useWebMediaQueries()

    // rendering
    // =

    if (!active) {
      return <View />
    }

    return (
      <View style={styles.mask} aria-modal accessibilityViewIsModal>
        <View
          style={[
            styles.container,
            isMobile && styles.containerMobile,
            pal.view,
            pal.border,
          ]}>
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
    borderRadius: 8,
    marginBottom: 0,
    borderWidth: 1,
    // @ts-ignore web only
    maxHeight: 'calc(100% - (40px * 2))',
  },
  containerMobile: {
    borderRadius: 0,
    marginBottom: BOTTOM_BAR_HEIGHT,
    // @ts-ignore web only
    maxHeight: `calc(100% - ${BOTTOM_BAR_HEIGHT}px)`,
  },
})
