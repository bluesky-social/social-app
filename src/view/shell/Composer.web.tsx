import React, {useCallback, useMemo, useRef, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {ComposePost} from '../com/composer/Composer'
import {ComposerOpts} from 'state/models/ui/shell'
import {usePalette} from 'lib/hooks/usePalette'
import {isMobileWeb} from 'platform/detection'
import {GalleryModel} from 'state/models/media/gallery'
import {useStores} from 'state/index'
import {RichText} from '@atproto/api'
import {colors} from 'lib/styles'
import {TextInputRef} from 'view/com/composer/text-input/TextInput'

export const Composer = observer(
  ({
    active,
    replyTo,
    quote,
    onPost,
  }: {
    active: boolean
    winHeight: number
    replyTo?: ComposerOpts['replyTo']
    quote: ComposerOpts['quote']
    onPost?: ComposerOpts['onPost']
  }) => {
    const pal = usePalette('default')
    const store = useStores()
    const textInput = useRef<TextInputRef>(null)
    const [gallery, setGallery] = useState(() => new GalleryModel(store))
    const [richtext, setRichText] = useState(new RichText({text: ''}))
    const graphemeLength = useMemo(() => richtext.graphemeLength, [richtext])

    const onInnerPress = () => {
      // do nothing, we just want to stop it from bubbling
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
      // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
      <TouchableWithoutFeedback onPress={onPressCancel}>
        <View style={styles.mask} aria-modal accessibilityViewIsModal>
          {/* eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors */}
          <TouchableWithoutFeedback onPress={onInnerPress}>
            <View style={[styles.container, pal.view, pal.border]}>
              <ComposePost
                replyTo={replyTo}
                quote={quote}
                onPost={onPost}
                onClose={onPressCancel}
                gallery={gallery}
                richtext={richtext}
                setRichText={(text: RichText) => setRichText(text)}
                textInput={textInput}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    borderRadius: isMobileWeb ? 0 : 8,
    marginBottom: '10vh',
    borderWidth: 1,
  },
})
