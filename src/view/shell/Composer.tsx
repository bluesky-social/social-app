import React, {useEffect, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, Easing, Platform, StyleSheet, View} from 'react-native'
import {ComposePost} from '../com/composer/Composer'
import {ComposerOpts} from 'state/models/ui/shell'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {GalleryModel} from 'state/models/media/gallery'
import {RichText} from '@atproto/api'
import {TextInputRef} from 'view/com/composer/text-input/TextInput'

export const Composer = observer(
  ({
    active,
    winHeight,
    replyTo,
    onPost,
    quote,
  }: {
    active: boolean
    winHeight: number
    replyTo?: ComposerOpts['replyTo']
    onPost?: ComposerOpts['onPost']
    quote?: ComposerOpts['quote']
  }) => {
    const pal = usePalette('default')
    const initInterp = useAnimatedValue(0)
    const store = useStores()
    const textInput = useRef<TextInputRef>(null)
    const [gallery, setGallery] = useState(() => new GalleryModel(store))
    const [richtext, setRichText] = useState(new RichText({text: ''}))

    useEffect(() => {
      if (active) {
        Animated.timing(initInterp, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start()
      } else {
        initInterp.setValue(0)
      }
    }, [initInterp, active])
    const wrapperAnimStyle = {
      transform: [
        {
          translateY: initInterp.interpolate({
            inputRange: [0, 1],
            outputRange: [winHeight, 0],
          }),
        },
      ],
    }

    const onClose = () => {
      setGallery(new GalleryModel(store))
      setRichText(new RichText({text: ''}))
      store.shell.closeComposer()
    }

    // rendering
    // =

    if (!active) {
      return <View />
    }

    return (
      <Animated.View
        style={[styles.wrapper, pal.view, wrapperAnimStyle]}
        aria-modal
        accessibilityViewIsModal>
        <ComposePost
          replyTo={replyTo}
          onPost={onPost}
          onClose={onClose}
          quote={quote}
          gallery={gallery}
          richtext={richtext}
          setRichText={setRichText}
          textInput={textInput}
        />
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        paddingTop: 24,
      },
    }),
  },
})
