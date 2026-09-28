import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {setStringAsync} from 'expo-clipboard'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type LabConfig} from './config'
import {type Probe, type ProbeSnapshot, type Verdict} from './probe'

const POLL_MS = 200

function fmt(n: number | null | undefined) {
  return n == null ? '–' : (Math.round(n * 10) / 10).toFixed(1)
}

function ActionButton({
  label,
  active = false,
  primary = false,
  onPress,
}: {
  label: string
  active?: boolean
  primary?: boolean
  onPress: () => void
}) {
  return (
    <Button
      label={label}
      size="tiny"
      color={active ? 'negative_subtle' : primary ? 'primary' : 'secondary'}
      onPress={onPress}
      style={[a.flex_grow]}>
      <ButtonText>{active ? `Cancel ${label}` : label}</ButtonText>
    </Button>
  )
}

/**
 * Triggers and the readout. Polls the probe on its own timer so that neither
 * re-renders the list.
 */
export function Panel({
  probe,
  config,
  onReset,
  onOpenKnobs,
}: {
  probe: Probe
  config: LabConfig
  onReset: () => void
  onOpenKnobs: () => void
}) {
  const t = useTheme()
  const [snap, setSnap] = useState<ProbeSnapshot>(() => probe.snapshot())
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      void probe.refreshAnchor()
      setSnap(probe.snapshot())
    }, POLL_MS)
    return () => clearInterval(id)
  }, [probe])

  const refresh = () => setSnap(probe.snapshot())
  const armed = probe.armedTrigger()

  const copy = (all: boolean) => {
    const runs = all ? probe.runs : probe.runs.slice(-1)
    void setStringAsync(JSON.stringify(runs, null, 2))
    Toast.show(
      all
        ? `Copied ${runs.length} runs as JSON`
        : 'Copied the last run as JSON',
    )
  }

  const verdictColor = (verdict: Verdict | undefined) => {
    switch (verdict) {
      case 'held':
      case 'smooth':
        return t.palette.positive_500
      case 'drifted':
      case 'jumped':
      case 'lost':
        return t.palette.negative_500
      default:
        return t.atoms.text.color
    }
  }
  const lastVerdict = probe.runs.at(-1)?.verdict
  const vl = snap.vl

  return (
    <View
      style={[
        a.border_t,
        a.px_sm,
        a.pt_xs,
        a.gap_xs,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        <ActionButton
          label={`Now (${config.prependCount})`}
          primary
          onPress={() => {
            probe.prependNow()
            refresh()
          }}
        />
        <ActionButton
          label={`In ${config.delayMs / 1000}s`}
          active={armed === 'delay'}
          onPress={() => {
            probe.arm('delay')
            refresh()
          }}
        />
        <ActionButton
          label="Mid-drag"
          active={armed === 'drag'}
          onPress={() => {
            probe.arm('drag')
            refresh()
          }}
        />
        <ActionButton
          label="On release"
          active={armed === 'release'}
          onPress={() => {
            probe.arm('release')
            refresh()
          }}
        />
        <ActionButton
          label={IS_IOS ? 'Top bounce' : 'At top'}
          active={armed === 'top'}
          onPress={() => {
            probe.arm('top')
            refresh()
          }}
        />
      </View>
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        <ActionButton
          label={`Repeat ${config.repeatCount}×`}
          onPress={() => {
            probe.prependRepeatedly()
            refresh()
          }}
        />
        <ActionButton label="↑ Top" onPress={() => probe.scrollToTop()} />
        <ActionButton
          label="↓ 3 screens"
          onPress={() => probe.scrollScreens(3)}
        />
        <ActionButton label="Reset" onPress={onReset} />
        <ActionButton label="Knobs" onPress={onOpenKnobs} />
      </View>

      <View style={[a.gap_2xs, a.pb_xs]}>
        {snap.armed && (
          <Text
            style={[a.text_xs, a.font_bold, {color: t.palette.primary_500}]}>
            {snap.armed}
          </Text>
        )}
        <LineText>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {
                color: snap.idle
                  ? t.palette.positive_500
                  : t.palette.negative_500,
              },
            ]}>
            {snap.dragging ? 'dragging' : snap.idle ? 'idle' : 'moving'}
          </Text>
          {` · offset ${fmt(snap.offset)} · content ${fmt(snap.contentHeight)} · viewport ${fmt(snap.viewportHeight)}`}
        </LineText>
        <LineText>
          {`mounted ${snap.rendered} · VL visible ${snap.visible}`}
        </LineText>
        <LineText>
          {vl
            ? `VL window ${vl.first}..${vl.last} · pending ${vl.pending} · JS offset ${fmt(vl.jsOffset)} · avg cell ${fmt(vl.avgCell)}`
            : 'VL internals unavailable'}
        </LineText>
        <LineText>
          {snap.anchor
            ? `anchor ${snap.anchor.label} · ${snap.anchor.mounted ? 'mounted' : 'UNMOUNTED'} · y ${fmt(snap.anchor.y)}`
            : 'anchor – (picked when a prepend fires)'}
        </LineText>
        {snap.run ? (
          <Button
            label="Toggle run details"
            onPress={() => setExpanded(e => !e)}
            style={[a.justify_start]}>
            <Text
              style={[
                a.text_xs,
                a.font_bold,
                a.flex_1,
                {
                  color: snap.run.active
                    ? t.atoms.text.color
                    : verdictColor(lastVerdict),
                },
              ]}>
              {snap.run.summary}
              {snap.run.details.length ? (expanded ? '  ▴' : '  ▾') : ''}
            </Text>
          </Button>
        ) : (
          <LineText>
            No runs yet. Pick a scenario and follow its recipe.
          </LineText>
        )}
        {expanded &&
          snap.run?.details.map((line, i) => (
            <LineText key={i}>{line}</LineText>
          ))}
        {snap.runCount > 0 && (
          <View style={[a.flex_row, a.gap_xs]}>
            <ActionButton label="Copy last run" onPress={() => copy(false)} />
            <ActionButton
              label={`Copy all (${snap.runCount})`}
              onPress={() => copy(true)}
            />
            <ActionButton
              label="Clear runs"
              onPress={() => {
                probe.clearRuns()
                setExpanded(false)
                refresh()
              }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

function LineText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_xs,
        t.atoms.text_contrast_high,
        {fontVariant: ['tabular-nums']},
      ]}>
      {children}
    </Text>
  )
}
