import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {H3, Text} from '#/components/Typography'
import {FEED_MAX_TO_RENDER_PER_BATCH, type LabConfig} from './config'

type Option<T> = {value: T; label: string}

function Chips<T extends string | number | boolean>({
  title,
  hint,
  value,
  options,
  onChange,
}: {
  title: string
  hint?: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_xs]}>
      <Text style={[a.text_sm, a.font_bold]}>{title}</Text>
      {hint && (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{hint}</Text>
      )}
      <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
        {options.map(option => (
          <Button
            key={String(option.value)}
            label={`${title}: ${option.label}`}
            size="tiny"
            color={option.value === value ? 'primary' : 'secondary'}
            onPress={() => onChange(option.value)}>
            <ButtonText>{option.label}</ButtonText>
          </Button>
        ))}
      </View>
    </View>
  )
}

const ON_OFF: Option<boolean>[] = [
  {value: false, label: 'Off'},
  {value: true, label: 'On'},
]

function numbers(values: number[], unit = ''): Option<number>[] {
  return values.map(value => ({value, label: `${value}${unit}`}))
}

function seconds(values: number[]): Option<number>[] {
  return values.map(value => ({value, label: `${value / 1000}s`}))
}

export function KnobsDialog({
  control,
  config,
  feedInitialNumToRender,
  onChange,
  onRestorePreset,
}: {
  control: Dialog.DialogControlProps
  config: LabConfig
  feedInitialNumToRender: number
  onChange: (patch: Partial<LabConfig>) => void
  onRestorePreset: () => void
}) {
  const t = useTheme()
  const set =
    <K extends keyof LabConfig>(key: K) =>
    (value: LabConfig[K]) =>
      onChange({[key]: value})

  let minIndexHint = `Matches the ${config.leadingRows} leading row(s).`
  if (config.minIndexForVisible < config.leadingRows) {
    minIndexHint =
      'Below the leading rows: a leading row can be the anchor (scenario 6).'
  } else if (config.minIndexForVisible > config.leadingRows) {
    minIndexHint = 'Above the leading rows: content rows are skipped.'
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label="Prepend lab knobs">
        <View style={[a.gap_lg, a.pb_xl]}>
          <View style={[a.gap_xs]}>
            <H3>Knobs</H3>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              Prepend knobs apply to the next prepend. List and row knobs
              regenerate the data and remount the list.
            </Text>
          </View>

          <Text style={[a.text_md, a.font_bold]}>Prepend</Text>
          <Chips
            title="Rows per prepend"
            value={config.prependCount}
            options={numbers([1, 5, 10, 15, 20, 40])}
            onChange={set('prependCount')}
          />
          <Chips
            title="Prepended row heights"
            hint="The estimate for an unmeasured row is the running average, about 310pt."
            value={config.prependHeights}
            options={[
              {value: 'mixed', label: 'Mixed'},
              {value: 'short', label: 'Short (64–120)'},
              {value: 'tall', label: 'Tall (600–1400)'},
            ]}
            onChange={set('prependHeights')}
          />
          <Chips
            title="Delay"
            value={config.delayMs}
            options={seconds([1000, 2000, 3000, 5000])}
            onChange={set('delayMs')}
          />
          <Chips
            title="Repeat count"
            value={config.repeatCount}
            options={numbers([2, 3, 5, 10], '×')}
            onChange={set('repeatCount')}
          />
          <Chips
            title="Repeat interval"
            value={config.repeatIntervalMs}
            options={seconds([100, 250, 1000, 2000])}
            onChange={set('repeatIntervalMs')}
          />
          <Chips
            title="Queue a cells update with the prepend"
            hint="Calls VirtualizedList._updateCellsToRender() in the same tick, which is what every scroll frame does (scenario 5)."
            value={config.queueCellsUpdate}
            options={ON_OFF}
            onChange={set('queueCellsUpdate')}
          />
          <Chips
            title="Tracked anchor"
            value={config.anchorRule}
            options={[
              {value: 'fullyVisible', label: 'First fully visible row'},
              {value: 'topEdge', label: 'Row cut by the top edge'},
            ]}
            onChange={set('anchorRule')}
          />

          <Text style={[a.text_md, a.font_bold]}>List (resets)</Text>
          <Chips
            title="Leading non-content rows"
            value={config.leadingRows}
            options={numbers([0, 1, 2, 3])}
            onChange={set('leadingRows')}
          />
          <Chips
            title="minIndexForVisible"
            hint={minIndexHint}
            value={config.minIndexForVisible}
            options={numbers([0, 1, 2, 3])}
            onChange={set('minIndexForVisible')}
          />
          <Chips
            title="ListHeaderComponent"
            value={config.listHeader}
            options={ON_OFF}
            onChange={set('listHeader')}
          />
          <Chips
            title="removeClippedSubviews"
            value={config.removeClippedSubviews}
            options={ON_OFF}
            onChange={set('removeClippedSubviews')}
          />
          <Chips
            title="windowSize"
            value={config.windowSize}
            options={[
              {value: 3, label: '3'},
              {value: 5, label: '5'},
              {value: 9, label: '9 (feed)'},
              {value: 21, label: '21 (RN default)'},
            ]}
            onChange={set('windowSize')}
          />
          <Chips<number | 'feed'>
            title="initialNumToRender"
            value={config.initialNumToRender}
            options={[
              {value: 1, label: '1'},
              {value: 3, label: '3'},
              {value: 'feed', label: `Feed (${feedInitialNumToRender})`},
              {value: 10, label: '10 (RN default)'},
            ]}
            onChange={set('initialNumToRender')}
          />
          <Chips<number | 'feed'>
            title="maxToRenderPerBatch"
            value={config.maxToRenderPerBatch}
            options={[
              {value: 'feed', label: `Feed (${FEED_MAX_TO_RENDER_PER_BATCH})`},
              {value: 1, label: '1'},
              {value: 5, label: '5'},
              {value: 10, label: '10 (RN default)'},
            ]}
            onChange={set('maxToRenderPerBatch')}
          />

          <Text style={[a.text_md, a.font_bold]}>Rows (resets)</Text>
          <Chips
            title="Late resize"
            hint="Rows mount at a placeholder height, then resize once, like late media or text layout."
            value={config.resize}
            options={[
              {value: 'off', label: 'Off'},
              {value: 'shrink', label: 'Shrink (from 2×)'},
              {value: 'grow', label: 'Grow (from 0.4×)'},
            ]}
            onChange={set('resize')}
          />
          <Chips
            title="Resize which rows"
            value={config.resizeScope}
            options={[
              {value: 'prepended', label: 'Prepended only'},
              {value: 'all', label: 'All'},
            ]}
            onChange={set('resizeScope')}
          />
          <Chips
            title="Resize after"
            value={config.resizeDelayMs}
            options={numbers([150, 500, 1000], 'ms')}
            onChange={set('resizeDelayMs')}
          />
          <Chips
            title="Seed"
            value={config.seed}
            options={numbers([1, 2, 3, 4])}
            onChange={set('seed')}
          />
          <Chips
            title="Initial rows"
            value={config.initialRows}
            options={numbers([100, 200, 500])}
            onChange={set('initialRows')}
          />

          <Button
            label="Restore the scenario's knobs"
            size="small"
            color="secondary"
            onPress={onRestorePreset}>
            <ButtonText>Restore the scenario’s knobs</ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
