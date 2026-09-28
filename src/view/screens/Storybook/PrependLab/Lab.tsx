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
  const [generation, setGeneration] = useState(0)
  const [showExpected, setShowExpected] = useState(false)

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
    probe.reset()
    setRows(initialRows(next))
    setGeneration(g => g + 1)
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
              <ButtonText>{String(s.id)}</ButtonText>
            </Button>
          ))}
        </View>
        <Button
          label="Show or hide the expected result"
          onPress={() => setShowExpected(v => !v)}
          style={[a.justify_start]}>
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text style={[a.text_sm, a.font_bold]}>
              {scenario.id}. {scenario.title}
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                {scenario.deterministic ? '  · deterministic' : '  · recipe'}
                {modified ? ' · knobs changed' : ''}
              </Text>
            </Text>
            <Text style={[a.text_xs]}>{scenario.recipe}</Text>
            {showExpected ? (
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                Expected on stock RN 0.86.3: {scenario.expected}
              </Text>
            ) : (
              <Text style={[a.text_xs, {color: t.palette.primary_500}]}>
                Expected on stock RN 0.86.3 ▾
              </Text>
            )}
            <Text style={[a.text_2xs, t.atoms.text_contrast_medium]}>
              {knobSummary}
            </Text>
            {IS_WEB && (
              <Text style={[a.text_2xs, {color: t.palette.negative_500}]}>
                Web renders this, but maintainVisibleContentPosition isn’t a web
                target.
              </Text>
            )}
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
      </View>

      <Panel
        probe={probe}
        config={config}
        onReset={() => restart(config)}
        onOpenKnobs={() => knobsControl.open()}
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
