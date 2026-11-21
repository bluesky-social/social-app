import {useEffect, useLayoutEffect, useState} from 'react'
import {View} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {
  FEED_MAX_TO_RENDER_PER_BATCH,
  type LabConfig,
  listKey,
  scenarioConfig,
  type ScenarioId,
  SCENARIOS,
} from './config'
import {createInitialRows, prependRows} from './data'
import {FixedLineText} from './FixedLineText'
import {InfoOverlay} from './InfoOverlay'
import {KnobsDialog} from './Knobs'
import {LabList} from './LabList'
import {Panel} from './Panel'
import {Probe} from './probe'

function initialRows(config: LabConfig) {
  return createInitialRows({
    seed: config.seed,
    count: config.initialRows,
    leadingRows: config.leadingRows,
  })
}

export default function PrependLab() {
  const t = useTheme()
  const {footerHeight} = useShellLayout()
  const feedInitialNumToRender = useInitialNumToRender()
  const knobsControl = Dialog.useDialogControl()
  const [probe] = useState(() => new Probe())
  const [scenarioId, setScenarioId] = useState<ScenarioId>(1)
  const [config, setConfig] = useState(() => scenarioConfig(1))
  const [rows, setRows] = useState(() => initialRows(scenarioConfig(1)))
  const [generation, setGeneration] = useState(() => probe.currentGeneration())
  const [showDetails, setShowDetails] = useState(false)

  const scenario = SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0]
  const modified =
    JSON.stringify(config) !== JSON.stringify(scenarioConfig(scenarioId))
  const initialNumToRender =
    config.initialNumToRender === 'feed'
      ? feedInitialNumToRender
      : config.initialNumToRender
  const maxToRenderPerBatch =
    config.maxToRenderPerBatch === 'feed'
      ? FEED_MAX_TO_RENDER_PER_BATCH
      : config.maxToRenderPerBatch

  const restart = (next: LabConfig) => {
    // The new list is keyed on, and reports with, the generation reset hands out.
    setGeneration(probe.reset())
    setRows(initialRows(next))
  }

  const applyScenario = (id: ScenarioId) => {
    const next = scenarioConfig(id)
    setScenarioId(id)
    setConfig(next)
    restart(next)
  }

  const updateConfig = (patch: Partial<LabConfig>) => {
    const next = {...config, ...patch}
    setConfig(next)
    if (listKey(next) !== listKey(config)) restart(next)
  }

  useLayoutEffect(() => {
    probe.configure(
      {
        rowsPerPrepend: config.prependCount,
        anchorRule: config.anchorRule,
        queueCellsUpdate: config.queueCellsUpdate,
        delayMs: config.delayMs,
        repeatCount: config.repeatCount,
        repeatIntervalMs: config.repeatIntervalMs,
        resizeDelayMs: config.resize === 'off' ? null : config.resizeDelayMs,
        scenario: scenarioId,
        config: {
          ...config,
          initialNumToRender,
          maxToRenderPerBatch,
          scenarioModified: modified,
        },
      },
      () =>
        setRows(prev =>
          prependRows(prev, {
            seed: config.seed,
            count: config.prependCount,
            profile: config.prependHeights,
          }),
        ),
    )
  })

  useEffect(() => () => probe.dispose(), [probe])

  const footerStyle = useAnimatedStyle(() => ({
    marginBottom: footerHeight.get(),
  }))

  const knobSummary = [
    `${config.prependCount} rows (${config.prependHeights})`,
    `leading ${config.leadingRows}`,
    `minIndexForVisible ${config.minIndexForVisible}`,
    config.listHeader && 'ListHeaderComponent',
    `windowSize ${config.windowSize}`,
    `initialNumToRender ${initialNumToRender}`,
    `maxToRenderPerBatch ${maxToRenderPerBatch}`,
    `clipping ${config.removeClippedSubviews ? 'on' : 'off'}`,
    config.resize !== 'off' &&
      `resize ${config.resize} (${config.resizeScope}, ${config.resizeDelayMs}ms)`,
    config.queueCellsUpdate && 'queued cells update',
    config.anchorRule === 'topEdge' && 'anchor: top edge',
  ]
    .filter(Boolean)
    .join(' · ')

  /*
   * Every region around the list is built from fixed-height slots, so the
   * list's frame is the same for every scenario, knob and readout state, and
   * "↓ 3 screens" is always the same distance. Long text is in the overlay.
   */
  return (
    <Animated.View style={[a.flex_1, footerStyle]}>
      <View
        style={[
          a.px_sm,
          a.py_xs,
          a.gap_xs,
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_row, a.gap_xs]}>
          {SCENARIOS.map(s => (
            <Button
              key={s.id}
              label={`Scenario ${s.id}: ${s.title}`}
              size="tiny"
              color={s.id === scenarioId ? 'primary' : 'secondary'}
              onPress={() => applyScenario(s.id)}
              style={[a.flex_1]}>
              <ButtonText numberOfLines={1}>{String(s.id)}</ButtonText>
            </Button>
          ))}
        </View>
        <Button
          label="Show or hide the expected result and run details"
          onPress={() => setShowDetails(v => !v)}
          style={[a.justify_start]}>
          <View style={[a.flex_1, a.gap_2xs]}>
            <FixedLineText style={[a.text_sm, a.font_bold]}>
              {scenario.id}. {scenario.title}
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                {scenario.deterministic ? '  · deterministic' : '  · recipe'}
                {modified ? ' · knobs changed' : ''}
              </Text>
            </FixedLineText>
            <FixedLineText lines={2} style={[a.text_xs]}>
              {scenario.recipe}
            </FixedLineText>
            <FixedLineText style={[a.text_2xs, t.atoms.text_contrast_medium]}>
              {knobSummary}
            </FixedLineText>
            <FixedLineText style={[a.text_xs, {color: t.palette.primary_500}]}>
              {showDetails
                ? 'Hide details ▴'
                : IS_WEB
                  ? 'Expected result and run details ▾ · mVCP isn’t a web target'
                  : 'Expected on stock RN 0.86.3, and run details ▾'}
            </FixedLineText>
          </View>
        </Button>
      </View>

      <View
        ref={probe.viewportRef}
        collapsable={false}
        onLayout={e => probe.onViewportLayout(e.nativeEvent.layout.height)}
        style={[a.flex_1]}>
        <LabList
          key={`${listKey(config)}:${generation}`}
          rows={rows}
          probe={probe}
          generation={generation}
          minIndexForVisible={config.minIndexForVisible}
          listHeader={config.listHeader}
          removeClippedSubviews={config.removeClippedSubviews}
          windowSize={config.windowSize}
          initialNumToRender={initialNumToRender}
          maxToRenderPerBatch={maxToRenderPerBatch}
          resize={config.resize}
          resizeScope={config.resizeScope}
          resizeDelayMs={config.resizeDelayMs}
        />
        {showDetails && (
          <InfoOverlay
            probe={probe}
            scenario={scenario}
            knobSummary={knobSummary}
            onClose={() => setShowDetails(false)}
          />
        )}
      </View>

      <Panel
        probe={probe}
        config={config}
        onReset={() => restart(config)}
        onOpenKnobs={() => knobsControl.open()}
        onToggleDetails={() => setShowDetails(v => !v)}
      />

      <KnobsDialog
        control={knobsControl}
        config={config}
        feedInitialNumToRender={feedInitialNumToRender}
        onChange={updateConfig}
        onRestorePreset={() => applyScenario(scenarioId)}
      />
    </Animated.View>
  )
}
