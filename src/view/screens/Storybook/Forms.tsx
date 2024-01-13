import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {InputText} from '#/components/forms/InputText'
import {InputDate, utils} from '#/components/forms/InputDate'
import {InputGroup} from '#/components/forms/InputGroup'
import {Logo} from '#/view/icons/Logo'

export function Forms() {
  return (
    <View style={[a.gap_md, a.align_start]}>
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
  )
}
