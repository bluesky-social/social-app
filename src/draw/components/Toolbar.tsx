/**
 * Plain, undesigned controls for exercising the engine on-device (milestone 3).
 * The real designed toolbar and labeled color palette are milestone 10 — this
 * exists only to drive brush color/size, eraser, undo, redo, and clear during
 * verification.
 */

import {Pressable, StyleSheet, Text, View} from 'react-native'

import {type Brush} from '../engine/types'

const COLORS = [
  '#111111',
  '#e11d48',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#ffffff',
]
const SIZES: {label: string; value: number}[] = [
  {label: 'S', value: 6},
  {label: 'M', value: 14},
  {label: 'L', value: 32},
]

export type ToolbarProps = {
  brush: Brush
  canUndo: boolean
  canRedo: boolean
  onColor: (color: string) => void
  onSize: (size: number) => void
  onToggleErase: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

export function Toolbar({
  brush,
  canUndo,
  canRedo,
  onColor,
  onSize,
  onToggleErase,
  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  const erasing = brush.mode === 'erase'
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        {COLORS.map(c => {
          const selected = !erasing && brush.color.toLowerCase() === c
          return (
            <Pressable
              accessibilityRole="button"
              key={c}
              testID={`draw-color-${c}`}
              onPress={() => onColor(c)}
              style={[
                styles.swatch,
                {backgroundColor: c},
                selected && styles.swatchSelected,
              ]}
            />
          )
        })}
      </View>
      <View style={styles.row}>
        {SIZES.map(s => (
          <Pressable
            accessibilityRole="button"
            key={s.label}
            testID={`draw-size-${s.label}`}
            onPress={() => onSize(s.value)}
            style={[
              styles.btn,
              !erasing && brush.size === s.value && styles.btnActive,
            ]}>
            <Text style={styles.btnText}>{s.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          testID="draw-erase"
          onPress={onToggleErase}
          style={[styles.btn, erasing && styles.btnActive]}>
          <Text style={styles.btnText}>Erase</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="draw-undo"
          onPress={onUndo}
          disabled={!canUndo}
          style={[styles.btn, !canUndo && styles.btnDisabled]}>
          <Text style={styles.btnText}>Undo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="draw-redo"
          onPress={onRedo}
          disabled={!canRedo}
          style={[styles.btn, !canRedo && styles.btnDisabled]}>
          <Text style={styles.btnText}>Redo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="draw-clear"
          onPress={onClear}
          style={styles.btn}>
          <Text style={styles.btnText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00000022',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  btnActive: {
    backgroundColor: '#2563eb',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
})
