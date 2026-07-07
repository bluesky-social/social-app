import {Trans, useLingui} from '@lingui/react/macro'

import {platform} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {type FollowingFilter} from './utils'

export function FollowingDropdown({
  value,
  onChange,
}: {
  value: FollowingFilter
  onChange: (value: FollowingFilter) => void
}) {
  const {t: l} = useLingui()

  const options: {value: FollowingFilter; label: string}[] = [
    {value: 'everyone', label: l`Anyone`},
    {value: 'following', label: l`People you follow`},
  ]
  const currentLabel =
    options.find(o => o.value === value)?.label ?? l`Everyone`

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
