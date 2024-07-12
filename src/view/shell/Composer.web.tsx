import React from 'react'
import {StyleSheet, View} from 'react-native'

import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'
import {useComposerState} from 'state/shell/composer'
import {
  EmojiPicker,
  EmojiPickerState,
} from 'view/com/composer/text-input/web/EmojiPicker.web'
import {useBreakpoints, useTheme} from '#/alf'
import {ComposePost} from '../com/composer/Composer'

const BOTTOM_BAR_HEIGHT = 61

export function Composer({}: {winHeight: number}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const state = useComposerState()
  const isActive = !!state
  useWebBodyScrollLock(isActive)

  const [pickerState, setPickerState] = React.useState<EmojiPickerState>({
    isOpen: false,
    pos: {top: 0, left: 0, right: 0, bottom: 0},
  })

  const onOpenPicker = React.useCallback((pos: DOMRect | undefined) => {
    if (!pos) return
    setPickerState({
      isOpen: true,
      pos,
    })
  }, [])

  const onClosePicker = React.useCallback(() => {
    setPickerState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  // rendering
  // =

  if (!isActive) {
    return <View />
  }

  return (
    <View style={styles.mask} aria-modal accessibilityViewIsModal>
      <View
        style={[
          styles.container,
          !gtMobile && styles.containerMobile,
          t.atoms.bg,
          t.atoms.border_contrast_medium,
        ]}>
        <ComposePost
          replyTo={state.replyTo}
          quote={state.quote}
          onPost={state.onPost}
          mention={state.mention}
          openPicker={onOpenPicker}
          text={state.text}
        />
      </View>
      <EmojiPicker state={pickerState} close={onClosePicker} />
    </View>
  )
}

const styles = StyleSheet.create({
  mask: {
    // @ts-ignore
    position: 'fixed',
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
