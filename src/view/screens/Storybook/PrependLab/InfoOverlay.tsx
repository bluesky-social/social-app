import {ScrollView, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {type Scenario} from './config'
import {type Probe} from './probe'
import {copyRuns, useProbeSnapshot, verdictColor} from './readout'

/**
 * The long-form readout: recipe, expected result, knobs and the last run's
 * details. It is absolutely positioned over the list viewport, so opening it
 * covers the list without resizing it: the list's frame, scroll position and
 * render window are exactly as they were when it closes.
 */
export function InfoOverlay({
  probe,
  scenario,
  knobSummary,
  onClose,
}: {
  probe: Probe
  scenario: Scenario
  knobSummary: string
  onClose: () => void
}) {
  const t = useTheme()
  const [snap, refresh] = useProbeSnapshot(probe)
  const lastVerdict = probe.runs.at(-1)?.verdict
  const mono = [a.text_xs, {fontVariant: ['tabular-nums' as const]}]

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.border_b,
        t.atoms.bg,
        t.atoms.border_contrast_medium,
      ]}>
      <ScrollView contentContainerStyle={[a.p_md, a.gap_sm]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Text style={[a.flex_1, a.text_md, a.font_bold]}>
            {scenario.id}. {scenario.title}
          </Text>
          <Button
            label="Close the details"
            size="tiny"
            color="secondary"
            onPress={onClose}>
            <ButtonText>Close</ButtonText>
          </Button>
        </View>
        <Text style={[a.text_sm]}>
          <Text style={[a.text_sm, a.font_bold]}>Recipe </Text>
          {scenario.recipe}
        </Text>
        <Text style={[a.text_sm]}>
          <Text style={[a.text_sm, a.font_bold]}>
            Expected on stock RN 0.86.3{' '}
          </Text>
          {scenario.expected}
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {knobSummary}
        </Text>

        <Text style={[a.text_md, a.font_bold, a.pt_sm]}>Last run</Text>
        {snap.run ? (
          <>
            <Text
              style={[
                a.text_sm,
                a.font_bold,
                {
                  color: snap.run.active
                    ? t.atoms.text.color
                    : verdictColor(t, lastVerdict),
                },
              ]}>
              {snap.run.summary}
            </Text>
            {snap.run.details.map((line, i) => (
              <Text key={i} style={mono}>
                {line}
              </Text>
            ))}
          </>
        ) : (
          <Text style={[a.text_sm]}>No runs yet.</Text>
        )}

        <View style={[a.flex_row, a.flex_wrap, a.gap_xs, a.pt_sm]}>
          <Button
            label="Copy the last run as JSON"
            size="tiny"
            color="secondary"
            disabled={snap.runCount === 0}
            onPress={() => copyRuns(probe, 'last')}>
            <ButtonText>Copy last run</ButtonText>
          </Button>
          <Button
            label="Copy every run as JSON"
            size="tiny"
            color="secondary"
            disabled={snap.runCount === 0}
            onPress={() => copyRuns(probe, 'all')}>
            <ButtonText>{`Copy all (${snap.runCount})`}</ButtonText>
          </Button>
          <Button
            label="Clear the run history"
            size="tiny"
            color="negative_subtle"
            disabled={snap.runCount === 0}
            onPress={() => {
              probe.clearRuns()
              refresh()
            }}>
            <ButtonText>Clear runs</ButtonText>
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
