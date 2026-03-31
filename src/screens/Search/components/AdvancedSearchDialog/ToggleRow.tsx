import {atoms as a, native} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'

export function ToggleRow({
  name,
  label,
  value,
  onChange,
}: {
  name: string
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Toggle.Item
      name={name}
      label={label}
      type="checkbox"
      value={value}
      onChange={onChange}
      style={[a.flex_1, native([a.justify_between, a.flex_row_reverse])]}>
      <Toggle.Platform />
      <Toggle.LabelText style={[a.text_md]}>{label}</Toggle.LabelText>
    </Toggle.Item>
  )
}
