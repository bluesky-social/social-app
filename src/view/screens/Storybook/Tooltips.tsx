import {useState} from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Tooltip from '#/components/Tooltip'
import {H1} from '#/components/Typography'

export function Tooltips() {
  const [defaultVisible, setDefaultVisible] = useState(false)
  const [primaryVisible, setPrimaryVisible] = useState(false)

  return (
    <View style={[a.gap_md, a.align_start]}>
      <H1>Tooltips</H1>

      <View style={[a.flex_row, a.gap_md, a.align_start]}>
        <Tooltip.Outer
          visible={defaultVisible}
          onVisibleChange={setDefaultVisible}>
          <Tooltip.Target>
            <Button
              color="secondary"
              size="small"
              label="Toggle default tooltip"
              onPress={() => setDefaultVisible(v => !v)}>
              <ButtonText>Default</ButtonText>
            </Button>
          </Tooltip.Target>
          <Tooltip.BubbleText>This is a default tooltip.</Tooltip.BubbleText>
        </Tooltip.Outer>

        <Tooltip.Outer
          color="primary"
          visible={primaryVisible}
          onVisibleChange={setPrimaryVisible}>
          <Tooltip.Target>
            <Button
              color="primary_subtle"
              size="small"
              label="Toggle primary tooltip"
              onPress={() => setPrimaryVisible(v => !v)}>
              <ButtonText>Primary</ButtonText>
            </Button>
          </Tooltip.Target>
          <Tooltip.BubbleText>This is primary tooltip.</Tooltip.BubbleText>
        </Tooltip.Outer>
      </View>
    </View>
  )
}
