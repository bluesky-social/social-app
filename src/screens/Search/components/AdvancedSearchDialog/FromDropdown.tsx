import {Trans, useLingui} from '@lingui/react/macro'

import {platform} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {type FromFilter} from './utils'

export function FromDropdown({
  value,
  onChange,
}: {
  value: FromFilter
  onChange: (value: FromFilter) => void
}) {
  const {t: l} = useLingui()

  const options: {value: FromFilter; label: string}[] = [
    {value: 'anyone', label: l`Anyone`},
    {value: 'following', label: l`People I follow`},
    {value: 'me', label: l`Me`},
  ]
  const currentLabel = options.find(o => o.value === value)?.label ?? l`Anyone`

  return (
    <Menu.Root>
      <Menu.Trigger label={l`Filter by author (currently: ${currentLabel})`}>
        {({props}) => (
          <Button
            {...props}
            label={props.accessibilityLabel}
            size="small"
            color="secondary">
            <ButtonText>{currentLabel}</ButtonText>
            <ButtonIcon
              icon={platform({
                native: ChevronUpDownIcon,
                default: ChevronDownIcon,
              })}
            />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Filter by author</Trans>
        </Menu.LabelText>
        <Menu.Group>
          {options.map(option => (
            <Menu.Item
              key={option.value}
              label={option.label}
              onPress={() => onChange(option.value)}>
              <Menu.ItemText>{option.label}</Menu.ItemText>
              <Menu.ItemRadio selected={value === option.value} />
            </Menu.Item>
          ))}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
