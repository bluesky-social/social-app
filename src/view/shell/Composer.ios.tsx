import {useEffect, useState} from 'react'
import {Modal, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import {SafeAreaProvider} from 'react-native-safe-area-context'

import {useComposerState} from '#/state/shell/composer'
import {ComposePost, useComposerCancelRef} from '#/view/com/composer/Composer'
import {atoms as a, BreakpointWidthContext, useTheme} from '#/alf'
import {SheetCompatProvider as TooltipSheetCompatProvider} from '#/components/Tooltip'
import {IS_IPAD, IS_LIQUID_GLASS} from '#/env'

export function Composer() {
  const t = useTheme()
  const state = useComposerState()
  const ref = useComposerCancelRef()
  const [width, setWidth] = useState<number>()

  const open = !!state

  useEffect(() => {
    if (open && !IS_LIQUID_GLASS) {
      const entry = SystemBars.pushStackEntry({
        style: {
          statusBar: 'light',
        },
      })
      return () => SystemBars.popStackEntry(entry)
    }
  }, [open])

  return (
    <Modal
      aria-modal
      accessibilityViewIsModal
      visible={open}
      presentationStyle={IS_IPAD ? 'formSheet' : 'pageSheet'}
      supportedOrientations={
        IS_IPAD
          ? [
              'portrait',
              'portrait-upside-down',
              'landscape-left',
              'landscape-right',
            ]
          : ['portrait']
      }
      animationType="slide"
      onRequestClose={() => ref.current?.onPressCancel()}
      backdropColor="transparent">
      <ComposerSafeArea>
        <View
          onLayout={evt => setWidth(evt.nativeEvent.layout.width)}
          style={[a.flex_1, t.atoms.bg]}>
          <BreakpointWidthContext value={width}>
            <TooltipSheetCompatProvider>
              <ComposePost
                cancelRef={ref}
                replyTo={state?.replyTo}
                onPost={state?.onPost}
                onPostSuccess={state?.onPostSuccess}
                quote={state?.quote}
                mention={state?.mention}
                text={state?.text}
                imageUris={state?.imageUris}
                videoUri={state?.videoUri}
              />
            </TooltipSheetCompatProvider>
          </BreakpointWidthContext>
        </View>
      </ComposerSafeArea>
    </Modal>
  )
}

function ComposerSafeArea({children}: {children: React.ReactNode}) {
  return IS_IPAD ? <SafeAreaProvider>{children}</SafeAreaProvider> : children
}
