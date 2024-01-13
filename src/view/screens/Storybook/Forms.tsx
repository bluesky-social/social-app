import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text, H1, H3} from '#/components/Typography'
import {InputText} from '#/components/forms/InputText'
import {InputDate, utils} from '#/components/forms/InputDate'
import {InputGroup} from '#/components/forms/InputGroup'
import {Logo} from '#/view/icons/Logo'
import Toggle from '#/components/forms/Toggle'

export function Forms() {
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

        <Toggle.Group
          role="checkbox"
          maxSelections={2}
          values={['a', 'b']}
          onChange={e => console.log(e)}
          style={[a.gap_sm]}>
          <Toggle.Item name="a">
            <Toggle.Checkbox />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="b">
            <Toggle.Checkbox />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="c">
            <Toggle.Checkbox />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="d" disabled>
            <Toggle.Checkbox />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
        </Toggle.Group>

        <Toggle.Group
          role="checkbox"
          maxSelections={2}
          values={['a']}
          onChange={e => console.log(e)}
          style={[a.gap_sm]}>
          <Toggle.Item name="a">
            <Toggle.Switch />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="b">
            <Toggle.Switch />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="c">
            <Toggle.Switch />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="d" disabled>
            <Toggle.Switch />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
        </Toggle.Group>

        <Toggle.Group
          role="radio"
          values={['a']}
          onChange={e => console.log(e)}
          style={[a.gap_sm]}>
          <Toggle.Item name="a">
            <Toggle.Radio />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="b">
            <Toggle.Radio />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="c">
            <Toggle.Radio />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
          <Toggle.Item name="d" disabled>
            <Toggle.Radio />
            <Toggle.Label>Click me</Toggle.Label>
          </Toggle.Item>
        </Toggle.Group>
      </View>
    </View>
  )
}
