import {useState} from 'react'
import {type LayoutChangeEvent, StyleSheet, View} from 'react-native'
import {GestureDetector} from 'react-native-gesture-handler'

import * as Layout from '#/components/Layout'
import {Toolbar} from '#/draw/components/Toolbar'
import {DrawingCanvas} from '#/draw/engine/render'
import {DEFAULT_CANVAS_SIZE} from '#/draw/engine/types'
import {useDrawingEngine} from '#/draw/engine/useDrawingEngine'

/**
 * Dev-only harness for the drawing engine (DESIGN.md milestone 3). Not the
 * shipping UI — it exists to exercise capture, smoothing, width dynamics,
 * eraser, and undo/redo on-device. Reachable via the __DEV__ `/sys/draw` route.
 */
export function DrawScreen() {
  const engine = useDrawingEngine(DEFAULT_CANVAS_SIZE)
  const [viewSize, setViewSize] = useState(0)

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout
    const size = Math.floor(Math.min(width, height))
    setViewSize(size)
    engine.scale.value = size / engine.canvasSize
  }

  return (
    <Layout.Screen>
      <View style={styles.canvasArea} onLayout={onLayout}>
        {viewSize > 0 && (
          <GestureDetector gesture={engine.gesture}>
            <View
              collapsable={false}
              style={{width: viewSize, height: viewSize}}>
              <DrawingCanvas
                strokes={engine.strokes}
                livePath={engine.livePath}
                liveBrush={engine.brush}
                canvasSize={engine.canvasSize}
                viewSize={viewSize}
              />
            </View>
          </GestureDetector>
        )}
      </View>
      {/* Bottom padding keeps the controls clear of the shell tab bar (harness only). */}
      <View style={styles.toolbarWrap}>
        <Toolbar
          brush={engine.brush}
          canUndo={engine.canUndo}
          canRedo={engine.canRedo}
          onColor={engine.setColor}
          onSize={engine.setSize}
          onToggleErase={engine.toggleErase}
          onUndo={engine.undo}
          onRedo={engine.redo}
          onClear={engine.clear}
        />
      </View>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  canvasArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  toolbarWrap: {
    paddingBottom: 160,
  },
})
