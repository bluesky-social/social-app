import {type ActivityGroup, type ActivityItem} from '#/screens/Atmosphere/types'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function ActivityRawResponseDialog({
  control,
  response,
}: {
  control: Dialog.DialogControlProps
  response: ActivityItem | ActivityGroup
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner response={response} />
    </Dialog.Outer>
  )
}

function Inner({response}: {response: ActivityItem | ActivityGroup}) {
  return (
    <Dialog.ScrollableInner label="Raw response">
      <Text
        accessibilityRole="header"
        style={[a.text_xl, a.font_bold, a.pr_2xl, a.pb_lg]}>
        Raw response
      </Text>
      <Text
        testID="atmosphereRawResponse"
        selectable
        emoji
        style={[a.text_xs, {fontFamily: 'monospace'}]}>
        {JSON.stringify(response, null, 2)}
      </Text>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
