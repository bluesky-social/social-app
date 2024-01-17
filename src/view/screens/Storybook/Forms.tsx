import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text, H1, H3} from '#/components/Typography'
import {InputText} from '#/components/forms/InputText'
import {InputDate, utils} from '#/components/forms/InputDate'
import {InputGroup} from '#/components/forms/InputGroup'
import {Logo} from '#/view/icons/Logo'
import Toggle from '#/components/forms/Toggle'
import ToggleButton from '#/components/forms/ToggleButton'
import {Button} from '#/components/Button'

export function Forms() {
  const [toggleGroupAValues, setToggleGroupAValues] = React.useState(['a'])
  const [toggleGroupBValues, setToggleGroupBValues] = React.useState(['a', 'b'])
  const [toggleGroupCValues, setToggleGroupCValues] = React.useState(['a', 'b'])

  return (
    <View style={[a.gap_4xl, a.align_start]}>
      <H1>Forms</H1>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>InputText</H3>

        <InputText
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value=""
          onChange={text => console.log(text)}
        />
        <InputText
          hasError
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value="Test initial value"
          onChange={text => console.log(text)}
        />
        <InputText
          hasError
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value="Test initial value"
          onChange={text => console.log(text)}
          icon={Logo}
        />
        <InputText
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value=""
          onChange={text => console.log(text)}
          icon={Logo}
        />
        <InputText
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value=""
          onChange={text => console.log(text)}
          icon={Logo}
          suffix={() => <Text>.bksy.social</Text>}
        />
        <InputText
          multiline
          numberOfLines={3}
          testID="input"
          accessibilityLabel="Input"
          accessibilityHint="Enter some text"
          placeholder="Type here"
          value=""
          onChange={text => console.log(text)}
        />

        <H3>InputDate</H3>
        <InputDate
          testID="date"
          value={'2001-01-01'}
          onChange={date => console.log(date)}
          accessibilityLabel="Date"
          accessibilityHint="Enter a date"
        />
        <InputDate
          testID="date"
          value={utils.toSimpleDateString(new Date())}
          onChange={date => console.log(date)}
          accessibilityLabel="Date"
          accessibilityHint="Enter a date"
        />
      </View>

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>InputGroup (WIP)</H3>
        <InputGroup>
          <InputText
            testID="input"
            accessibilityLabel="Input"
            accessibilityHint="Enter some text"
            placeholder="Type here"
            value=""
            onChange={text => console.log(text)}
          />
          <InputText
            testID="input"
            accessibilityLabel="Input"
            accessibilityHint="Enter some text"
            placeholder="Type here"
            value=""
            onChange={text => console.log(text)}
          />
          <InputText
            testID="input"
            accessibilityLabel="Input"
            accessibilityHint="Enter some text"
            placeholder="Type here"
            value=""
            onChange={text => console.log(text)}
          />
        </InputGroup>
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

            <Button
              variant="solid"
              color="primary"
              size="small"
              accessibilityLabel="Reset"
              accessibilityHint="Reset"
              onPress={() => setToggleGroupAValues(['a'])}>
              Reset
            </Button>
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

      <View style={[a.gap_md, a.align_start, a.w_full]}>
        <H3>ToggleButton</H3>

        <ToggleButton.Group
          label="Preferences"
          values={['warn']}
          onChange={e => console.log(e)}>
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
