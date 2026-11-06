import {useEffect} from 'react'
import {StyleSheet, View} from 'react-native'
import * as DismissableLayer from '@radix-ui/react-dismissable-layer'
import * as FocusGuards from '@radix-ui/react-focus-guards'
import * as FocusScope from '@radix-ui/react-focus-scope'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {useA11y} from '#/state/a11y'
import {type ComposerOpts, useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, flatten, useBreakpoints, useTheme} from '#/alf'

const BOTTOM_BAR_HEIGHT = 61

export function Composer() {
  const state = useComposerState()
  const isActive = !!state

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
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {reduceMotionEnabled} = useA11y()

  FocusGuards.useFocusGuards()

  /*
   * Push a history entry so that browser back (or a back swipe) is caught
   * here instead of navigating the page underneath. It copies the current
   * entry's state, including react-navigation's `id`, so react-navigation
   * treats it as the same entry. On back, we restore the entry and go through
   * the same path as pressing cancel, which asks whether to save a draft.
   */
  useEffect(() => {
    const pushComposerEntry = () => {
      history.pushState({...history.state, composer: true}, '')
    }
    pushComposerEntry()

    const handlePopState = () => {
      pushComposerEntry()
      ref.current?.onPressCancel()
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      /*
       * Only pop our entry if it's still the current one. If navigation
       * already pushed a new entry on top, leave the orphaned entry - it
       * shares the same state so traversing through it is harmless.
       */
      if ((history.state as {composer?: boolean} | null)?.composer) {
        history.back()
      }
    }
  }, [ref])

  return (
    <FocusScope.FocusScope loop trapped asChild>
      <DismissableLayer.DismissableLayer
        role="dialog"
        aria-modal
        style={flatten([
          {position: 'fixed'},
          a.inset_0,
          {backgroundColor: '#000c'},
          a.flex,
          a.flex_col,
          a.align_center,
          !reduceMotionEnabled && a.fade_in,
        ])}
        onFocusOutside={evt => evt.preventDefault()}
        onInteractOutside={evt => evt.preventDefault()}
        onDismiss={() => ref.current?.onPressCancel()}>
        <View
          style={[
            styles.container,
            !gtMobile && styles.containerMobile,
            t.atoms.bg,
            t.atoms.border_contrast_medium,
            !reduceMotionEnabled && [
              a.zoom_fade_in,
              {animationDelay: 0.1},
              {animationFillMode: 'backwards'},
            ],
          ]}>
          <ComposePost
            cancelRef={ref}
            replyTo={state.replyTo}
            quote={state.quote}
            onPost={state.onPost}
            onPostSuccess={state.onPostSuccess}
            mention={state.mention}
            text={state.text}
            imageUris={state.imageUris}
            openGallery={state.openGallery}
          />
        </View>
      </DismissableLayer.DismissableLayer>
    </FocusScope.FocusScope>
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
    maxHeight: 'calc(100% - (40px * 2))',
    overflow: 'hidden',
  },
  containerMobile: {
    borderRadius: 0,
    marginBottom: BOTTOM_BAR_HEIGHT,
    maxHeight: `calc(100% - ${BOTTOM_BAR_HEIGHT}px)`,
  },
})
