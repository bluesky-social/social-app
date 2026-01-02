import React from 'react'
import {type TextInput, View} from 'react-native'

import {APP_LANGUAGES} from '#/lib/../locale/languages'
import {type CountryCode} from '#/lib/international-telephone-codes'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {DateField, LabelText} from '#/components/forms/DateField'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {InternationalPhoneCodeSelect} from '#/components/InternationalPhoneCodeSelect'
import * as Select from '#/components/Select'
import {H1, H3} from '#/components/Typography'

export function Forms() {
  const [toggleGroupAValues, setToggleGroupAValues] = React.useState(['a'])
  const [toggleGroupBValues, setToggleGroupBValues] = React.useState(['a', 'b'])
  const [toggleGroupCValues, setToggleGroupCValues] = React.useState(['a', 'b'])
  const [toggleGroupDValues, setToggleGroupDValues] = React.useState(['warn'])
  const [segmentedControlValue, setSegmentedControlValue] = React.useState<
    'hide' | 'warn' | 'show'
  >('warn')

  const [value, setValue] = React.useState('')
  const [date, setDate] = React.useState('2001-01-01')
  const [countryCode, setCountryCode] = React.useState<CountryCode>('US')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [lang, setLang] = React.useState('en')

  const inputRef = React.useRef<TextInput>(null)

  return (
    <View style={[a.gap_4xl, a.align_start]}>
      <H1>Forms</H1>

      <Select.Root value={lang} onValueChange={setLang}>
        <Select.Trigger label="Select app language">
          <Select.ValueText />
          <Select.Icon />
        </Select.Trigger>
        <Select.Content
          label="App language"
          renderItem={({label, value}) => (
            <Select.Item value={value} label={label}>
              <Select.ItemIndicator />
              <Select.ItemText>{label}</Select.ItemText>
            </Select.Item>
          )}
          items={APP_LANGUAGES.map(l => ({
            label: l.name,
            value: l.code2,
          }))}
        />
      </Select.Root>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>InputText</H3>

        <TextField.Input
          value={value}
          onChangeText={setValue}
          label="Text field"
        />

        <View style={[a.flex_row, a.align_start, a.gap_sm]}>
          <View style={[a.flex_1]}>
            <TextField.Root>
              <TextField.Icon icon={Globe} />
              <TextField.Input
                inputRef={inputRef}
                value={value}
                onChangeText={setValue}
                label="Text field"
              />
            </TextField.Root>
          </View>
          <Button
            label="Submit"
            size="large"
            variant="solid"
            color="primary"
            onPress={() => inputRef.current?.clear()}>
            <ButtonText>Submit</ButtonText>
          </Button>
        </View>

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
            isInvalid
          />
        </TextField.Root>

        <View style={[a.w_full]}>
          <TextField.LabelText>Text field</TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={Globe} />
            <TextField.Input
              value={value}
              onChangeText={setValue}
              label="Text field"
            />
            <TextField.SuffixText label="@gmail.com">
              @gmail.com
            </TextField.SuffixText>
          </TextField.Root>
        </View>

        <View style={[a.w_full]}>
          <TextField.LabelText>Textarea</TextField.LabelText>
          <TextField.Input
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={setValue}
            label="Text field"
          />
        </View>

        <H3>DateField</H3>

        <View style={[a.w_full]}>
          <LabelText>Date</LabelText>
          <DateField
            testID="date"
            value={date}
            onChangeDate={date => {
              console.log(date)
              setDate(date)
            }}
            label="Input"
          />
        </View>
        <H3>InternationalPhoneCodeSelect</H3>

        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          <View>
            <InternationalPhoneCodeSelect
              value={countryCode}
              onChange={value => setCountryCode(value)}
            />
          </View>
          <View style={[a.flex_1]}>
            <TextField.Input
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>
      </View>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>Toggles</H3>

        <Toggle.Item name="a" label="Click me">
          <Toggle.Checkbox />
          <Toggle.LabelText>Uncontrolled toggle</Toggle.LabelText>
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
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Switch />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Toggle.Item name="d" disabled value label="Click me">
          <Toggle.Switch />
          <Toggle.LabelText>Click me</Toggle.LabelText>
        </Toggle.Item>
        <Toggle.Item name="d" disabled value isInvalid label="Click me">
          <Toggle.Switch />
          <Toggle.LabelText>Click me</Toggle.LabelText>
        </Toggle.Item>

        <Toggle.Group
          label="Toggle"
          type="checkbox"
          maxSelections={2}
          values={toggleGroupBValues}
          onChange={setToggleGroupBValues}>
          <View style={[a.gap_md]}>
            <Toggle.Item name="a" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Checkbox />
              <Toggle.LabelText>Click me</Toggle.LabelText>
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
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="b" label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="c" label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="d" disabled label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
            <Toggle.Item name="e" isInvalid label="Click me">
              <Toggle.Radio />
              <Toggle.LabelText>Click me</Toggle.LabelText>
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>

      <Button
        variant="solid"
        color="primary"
        size="small"
        label="Reset all toggles"
        onPress={() => {
          setToggleGroupAValues(['a'])
          setToggleGroupBValues(['a', 'b'])
          setToggleGroupCValues(['a'])
        }}>
        <ButtonText>Reset all toggles</ButtonText>
      </Button>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>ToggleButton</H3>

        <ToggleButton.Group
          label="Preferences"
          values={toggleGroupDValues}
          onChange={setToggleGroupDValues}>
          <ToggleButton.Button name="hide" label="Hide">
            <ToggleButton.ButtonText>Hide</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="warn" label="Warn">
            <ToggleButton.ButtonText>Warn</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="show" label="Show">
            <ToggleButton.ButtonText>Show</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>SegmentedControl</H3>

        <SegmentedControl.Root
          label="Preferences"
          type="radio"
          value={segmentedControlValue}
          onChange={setSegmentedControlValue}>
          <SegmentedControl.Item value="hide" label="Hide">
            <SegmentedControl.ItemText>Hide</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="warn" label="Warn">
            <SegmentedControl.ItemText>Warn</SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="show" label="Show">
            <SegmentedControl.ItemText>Show</SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </View>
    </View>
  )
}
