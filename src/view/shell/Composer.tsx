import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import {ComposePost} from '../com/composer/Composer'
import {ComposerOpts} from 'state/models/ui/shell'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {GalleryModel} from 'state/models/media/gallery'
import {RichText} from '@atproto/api'
import {TextInputRef} from 'view/com/composer/text-input/TextInput'
import {colors} from 'lib/styles'

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
    const graphemeLength = useMemo(() => richtext.graphemeLength, [richtext])

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

    const onClose = useCallback(() => {
      store.shell.closeComposer()
    }, [store])

    // HACK
    // there's a bug with @mattermost/react-native-paste-input where if the input
    // is focused during unmount, an exception will throw (seems that a blur method isn't implemented)
    // manually blurring before closing gets around that
    // -prf
    const hackfixOnClose = useCallback(() => {
      textInput.current?.blur()
      setRichText(new RichText({text: ''}))
      setGallery(new GalleryModel(store))
      onClose()
    }, [store, onClose])

    const onPressCancel = () => {
      if (graphemeLength > 0 || !gallery.isEmpty) {
        if (store.shell.activeModals.some(modal => modal.name === 'confirm')) {
          store.shell.closeModal()
        }
        if (Keyboard) {
          Keyboard.dismiss()
        }
        store.shell.openModal({
          name: 'confirm',
          title: 'Discard draft',
          onPressConfirm: hackfixOnClose,
          onPressCancel: () => {
            store.shell.closeModal()
          },
          message: "Are you sure you'd like to discard this draft?",
          confirmBtnText: 'Discard',
          confirmBtnStyle: {backgroundColor: colors.red4},
        })
      } else {
        hackfixOnClose()
      }
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
          onClose={onPressCancel}
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
