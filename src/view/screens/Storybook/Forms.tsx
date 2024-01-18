import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {H1, H3} from '#/components/Typography'
import TextField from '#/components/forms/TextField'
import {InputDate, utils} from '#/components/forms/InputDate'
import Toggle from '#/components/forms/Toggle'
import ToggleButton from '#/components/forms/ToggleButton'
import {Button} from '#/components/Button'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'

export function Forms() {
  const [toggleGroupAValues, setToggleGroupAValues] = React.useState(['a'])
  const [toggleGroupBValues, setToggleGroupBValues] = React.useState(['a', 'b'])
  const [toggleGroupCValues, setToggleGroupCValues] = React.useState(['a', 'b'])
  const [toggleGroupDValues, setToggleGroupDValues] = React.useState(['warn'])

  const [value, setValue] = React.useState('')

  return (
    <View style={[a.gap_4xl, a.align_start]}>
      <H1>Forms</H1>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>InputText</H3>

        <TextField.Input
          value={value}
          onChangeText={setValue}
          label="Text field"
        />

        <TextField.Root>
          <TextField.Icon icon={Globe} />
          <TextField.Input
            value={value}
            onChangeText={setValue}
            label="Text field"
          />
        </TextField.Root>

        <TextField.Root>
          <TextField.Icon icon={Globe} />
          <TextField.Input
            value={value}
            onChangeText={setValue}
            label="Text field"
          />
          <TextField.Suffix label="@gmail.com">@gmail.com</TextField.Suffix>
        </TextField.Root>

        <H3>InputDate</H3>
        <InputDate
          testID="date"
          value={'2001-01-01'}
          onChange={date => console.log(date)}
          label="Input"
        />
        <InputDate
          testID="date"
          value={utils.toSimpleDateString(new Date())}
          onChange={date => console.log(date)}
          label="Input"
        />
      </View>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>Toggles</H3>

        <Toggle.Item name="a" label="Click me">
          <Toggle.Checkbox />
          <Toggle.Label>Uncontrolled toggle</Toggle.Label>
        </Toggle.Item>

        <Toggle.Group
          label="Toggle"
          type="checkbox"
          maxSelections={2}
          values={toggleGroupAValues}
          onChange={setToggleGroupAValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Switch />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Switch />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Switch />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Switch />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="e" hasError label="Click me">
              <Toggle.Switch />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Toggle.Group
          label="Toggle"
          type="checkbox"
          maxSelections={2}
          values={toggleGroupBValues}
          onChange={setToggleGroupBValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Checkbox />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Checkbox />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Checkbox />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Checkbox />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="e" hasError label="Click me">
              <Toggle.Checkbox />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Toggle.Group
          label="Toggle"
          type="radio"
          values={toggleGroupCValues}
          onChange={setToggleGroupCValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Radio />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Radio />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Radio />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Radio />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
            <Toggle.Item name="e" hasError label="Click me">
              <Toggle.Radio />
              <Toggle.Label>Click me</Toggle.Label>
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>

      <Button
        variant="gradient"
        color="gradient_nordic"
        size="small"
        label="Reset all toggles"
        onPress={() => {
          setToggleGroupAValues(['a'])
          setToggleGroupBValues(['a', 'b'])
          setToggleGroupCValues(['a'])
        }}>
        Reset all toggles
      </Button>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>ToggleButton</H3>

        <ToggleButton.Group
          label="Preferences"
          values={toggleGroupDValues}
          onChange={setToggleGroupDValues}>
          <ToggleButton.Button name="hide" label="Hide">
            Hide
          </ToggleButton.Button>
          <ToggleButton.Button name="warn" label="Warn">
            Warn
          </ToggleButton.Button>
          <ToggleButton.Button name="show" label="Show">
            Show
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </View>
  )
}
