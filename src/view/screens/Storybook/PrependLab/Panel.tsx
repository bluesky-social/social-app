import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {describeOscillation} from './analysis'
import {type LabConfig} from './config'
import {FixedLineText} from './FixedLineText'
import {type Probe} from './probe'
import {copyRuns, useProbeSnapshot, verdictColor} from './readout'

function fmt(n: number | null | undefined) {
  return n == null ? '–' : (Math.round(n * 10) / 10).toFixed(1)
}

/**
 * One-line, fixed-width button: its label never wraps and the row never
 * reflows, so the panel's height doesn't depend on labels or armed state.
 */
function ActionButton({
  text,
  label,
  active = false,
  primary = false,
  disabled = false,
  onPress,
}: {
  text: string
  label: string
  active?: boolean
  primary?: boolean
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Button
      label={label}
      size="tiny"
      color={active ? 'negative_subtle' : primary ? 'primary' : 'secondary'}
      disabled={disabled}
      onPress={onPress}
      style={[a.flex_1]}>
      <ButtonText numberOfLines={1}>{text}</ButtonText>
    </Button>
  )
}

function ButtonRow({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_row, a.gap_xs]}>{children}</View>
}

/**
 * Triggers and the readout. It polls the probe on its own state, so a refresh
 * re-renders only the panel, never the list, and every line is a fixed-height
 * slot, so a refresh can't change the list's frame either. Anything long
 * lives in the details overlay.
 */
export function Panel({
  probe,
  config,
  onReset,
  onOpenKnobs,
  onToggleDetails,
}: {
  probe: Probe
  config: LabConfig
  onReset: () => void
  onOpenKnobs: () => void
  onToggleDetails: () => void
}) {
  const t = useTheme()
  const [snap, refresh] = useProbeSnapshot(probe, {housekeeping: true})
  const armed = probe.armedTrigger()
  const vl = snap.vl
  const lastVerdict = probe.runs.at(-1)?.verdict

  const arm = (kind: Parameters<Probe['arm']>[0]) => () => {
    probe.arm(kind)
    refresh()
  }

  let status: string = snap.status
  if (snap.status === 'oscillating' && snap.oscillation) {
    status = `OSCILLATING · ${describeOscillation(snap.oscillation)}`
  }
  const lineStyle = [
    a.text_xs,
    t.atoms.text_contrast_high,
    {fontVariant: ['tabular-nums' as const]},
  ]

  return (
    <View
      style={[
        a.border_t,
        a.px_sm,
        a.py_xs,
        a.gap_xs,
        t.atoms.border_contrast_low,
      ]}>
      <ButtonRow>
        <ActionButton
          text={`Now ${config.prependCount}`}
          label={`Prepend ${config.prependCount} rows now`}
          primary
          onPress={() => {
            probe.prependNow()
            refresh()
          }}
        />
        <ActionButton
          text={`In ${config.delayMs / 1000}s`}
          label={`Prepend after ${config.delayMs / 1000} seconds`}
          active={armed === 'delay'}
          onPress={arm('delay')}
        />
        <ActionButton
          text={`Repeat ${config.repeatCount}×`}
          label={`Prepend ${config.repeatCount} times`}
          onPress={() => {
            probe.prependRepeatedly()
            refresh()
          }}
        />
        <ActionButton text="Reset" label="Reset the list" onPress={onReset} />
      </ButtonRow>
      <ButtonRow>
        <ActionButton
          text="Drag"
          label="Prepend 250ms into the next drag"
          active={armed === 'drag'}
          onPress={arm('drag')}
        />
        <ActionButton
          text="Release"
          label="Prepend when the next drag is released"
          active={armed === 'release'}
          onPress={arm('release')}
        />
        <ActionButton
          text={IS_IOS ? 'Bounce' : 'At top'}
          label={
            IS_IOS
              ? 'Prepend in the next top bounce'
              : 'Prepend on the next arrival at the top'
          }
          active={armed === 'top'}
          onPress={arm('top')}
        />
        <ActionButton
          text="Knobs"
          label="Open the knobs"
          onPress={onOpenKnobs}
        />
      </ButtonRow>
      <ButtonRow>
        <ActionButton
          text="↑ Top"
          label="Scroll to the top"
          onPress={() => probe.scrollToTop()}
        />
        <ActionButton
          text="↓ 3 screens"
          label="Scroll down three list viewports"
          onPress={() => probe.scrollScreens(3)}
        />
        <ActionButton
          text="Details"
          label="Show or hide the expected result and run details"
          onPress={onToggleDetails}
        />
        <ActionButton
          text="Copy all"
          label="Copy every run as JSON"
          disabled={snap.runCount === 0}
          onPress={() => copyRuns(probe, 'all')}
        />
      </ButtonRow>

      <View style={[a.gap_2xs]}>
        <FixedLineText style={lineStyle}>
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {
                color:
                  snap.status === 'idle'
                    ? t.palette.positive_500
                    : t.palette.negative_500,
              },
            ]}>
            {status}
          </Text>
          {snap.armed ? ` · ${snap.armed} (tap again to cancel)` : ''}
        </FixedLineText>
        <FixedLineText style={lineStyle}>
          {`offset ${fmt(snap.offset)} · content ${fmt(snap.contentHeight)} · viewport ${fmt(snap.viewportHeight)}`}
        </FixedLineText>
        <FixedLineText style={lineStyle}>
          {`mounted ${snap.rendered} · VL visible ${snap.visible}`}
        </FixedLineText>
        <FixedLineText style={lineStyle}>
          {vl
            ? `VL window ${vl.first}..${vl.last} · pending ${vl.pending}${vl.pending < 0 ? ' (<0)' : ''} · JS offset ${fmt(vl.jsOffset)} · avg cell ${fmt(vl.avgCell)}`
            : 'VL internals unavailable'}
        </FixedLineText>
        <FixedLineText style={lineStyle}>
          {snap.anchor
            ? `anchor ${snap.anchor.label} · ${snap.anchor.mounted ? 'mounted' : 'UNMOUNTED'} · y ${fmt(snap.anchor.y)}`
            : 'anchor – (picked when a prepend fires)'}
        </FixedLineText>
        <Button
          label="Show the run details"
          onPress={onToggleDetails}
          style={[a.justify_start]}>
          <FixedLineText
            lines={2}
            style={[
              a.flex_1,
              a.text_xs,
              a.font_bold,
              {
                color: snap.run?.active
                  ? t.atoms.text.color
                  : verdictColor(t, lastVerdict),
              },
            ]}>
            {snap.run
              ? `${snap.run.summary}  ▸`
              : 'No runs yet. Pick a scenario and follow its recipe.'}
          </FixedLineText>
        </Button>
      </View>
    </View>
  )
}
