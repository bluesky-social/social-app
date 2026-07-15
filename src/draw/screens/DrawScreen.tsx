import {useState} from 'react'
import {View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {Canvas, Path, Skia, type SkPath} from '@shopify/react-native-skia'

import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'

type Point = {x: number; y: number}

const STROKE_COLOR = '#000000'
const STROKE_WIDTH = 4

/**
 * Renders a smooth curve through raw sample points without transforming them:
 * each segment is a quadratic with the sample as its control point and the
 * midpoint to the next sample as its end. Stored points stay untouched so they
 * remain replayable (see DESIGN.md §6.2).
 */
function buildSmoothPath(points: Point[]): SkPath {
  const path = Skia.Path.Make()
  if (points.length === 0) return path

  if (points.length < 3) {
    // Too few samples to form a midpoint curve; a dot or a straight segment.
    path.moveTo(points[0].x, points[0].y)
    if (points.length === 1) {
      path.lineTo(points[0].x, points[0].y)
    } else {
      path.lineTo(points[1].x, points[1].y)
    }
    return path
  }

  const mid = (a: Point, b: Point) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2})

  const first = mid(points[0], points[1])
  path.moveTo(first.x, first.y)
  for (let i = 1; i < points.length - 1; i++) {
    const end = mid(points[i], points[i + 1])
    path.quadTo(points[i].x, points[i].y, end.x, end.y)
  }
  const last = points[points.length - 1]
  path.lineTo(last.x, last.y)

  return path
}

export function DrawScreen() {
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [current, setCurrent] = useState<Point[]>([])

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .averageTouches(true)
    .onBegin(e => {
      setCurrent([{x: e.x, y: e.y}])
    })
    .onUpdate(e => {
      setCurrent(prev => [...prev, {x: e.x, y: e.y}])
    })
    .onEnd(() => {
      setCurrent(prev => {
        if (prev.length > 0) {
          setStrokes(s => [...s, prev])
        }
        return []
      })
    })

  return (
    <Layout.Screen>
      <GestureDetector gesture={pan}>
        <View style={[a.flex_1]} collapsable={false}>
          <Canvas style={[a.flex_1]}>
            {strokes.map((points, i) => (
              <Path
                key={i}
                path={buildSmoothPath(points)}
                color={STROKE_COLOR}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
            {current.length > 0 && (
              <Path
                path={buildSmoothPath(current)}
                color={STROKE_COLOR}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Canvas>
        </View>
      </GestureDetector>
    </Layout.Screen>
  )
}
