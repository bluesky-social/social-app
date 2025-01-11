import React from 'react'
import {StyleSheet, View} from 'react-native'
import {DismissableLayer} from '@radix-ui/react-dismissable-layer'
import {useFocusGuards} from '@radix-ui/react-focus-guards'
import {FocusScope} from '@radix-ui/react-focus-scope'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useModals} from '#/state/modals'
import {ComposerOpts, useComposerState} from '#/state/shell/composer'
import {
  EmojiPicker,
  EmojiPickerPosition,
  EmojiPickerState,
} from '#/view/com/composer/text-input/web/EmojiPicker.web'
import {useBreakpoints, useTheme} from '#/alf'
import {ComposePost, useComposerCancelRef} from '../com/composer/Composer'

const BOTTOM_BAR_HEIGHT = 61

export function Composer({}: {winHeight: number}) {
  const state = useComposerState()
  const isActive = !!state

  // rendering
  // =

  if (!isActive) {
    return null
  }

  return (
    <>
      <RemoveScrollBar />
      <Inner state={state} />
    </>
  )
}

function Inner({state}: {state: ComposerOpts}) {
  const ref = useComposerCancelRef()
  const {isModalActive} = useModals()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const [pickerState, setPickerState] = React.useState<EmojiPickerState>({
    isOpen: false,
    pos: {top: 0, left: 0, right: 0, bottom: 0, nextFocusRef: null},
  })

  const onOpenPicker = React.useCallback(
    (pos: EmojiPickerPosition | undefined) => {
      if (!pos) return
      setPickerState({
        isOpen: true,
        pos,
      })
    },
    [],
  )

  const onClosePicker = React.useCallback(() => {
    setPickerState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  useFocusGuards()

  return (
    <FocusScope loop trapped asChild>
      <DismissableLayer
        role="dialog"
        aria-modal
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onFocusOutside={evt => evt.preventDefault()}
        onInteractOutside={evt => evt.preventDefault()}
        onDismiss={() => {
          // TEMP: remove when all modals are ALF'd -sfn
          if (!isModalActive) {
            ref.current?.onPressCancel()
          }
        }}>
        <View
          style={[
            styles.container,
            !gtMobile && styles.containerMobile,
            t.atoms.bg,
            t.atoms.border_contrast_medium,
          ]}>
          <ComposePost
            cancelRef={ref}
            replyTo={state.replyTo}
            quote={state.quote}
            onPost={state.onPost}
            mention={state.mention}
            openEmojiPicker={onOpenPicker}
            text={state.text}
            imageUris={state.imageUris}
          />
        </View>
        <EmojiPicker state={pickerState} close={onClosePicker} />
      </DismissableLayer>
    </FocusScope>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    maxWidth: 600,
    width: '100%',
    paddingVertical: 0,
    borderRadius: 8,
    marginBottom: 0,
    borderWidth: 1,
    // @ts-ignore web only
    maxHeight: 'calc(100% - (40px * 2))',
    overflow: 'hidden',
  },
  containerMobile: {
    borderRadius: 0,
    marginBottom: BOTTOM_BAR_HEIGHT,
    // @ts-ignore web only
    maxHeight: `calc(100% - ${BOTTOM_BAR_HEIGHT}px)`,
  },
})
