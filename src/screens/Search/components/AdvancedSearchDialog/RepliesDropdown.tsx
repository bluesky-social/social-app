import {Trans, useLingui} from '@lingui/react/macro'

import {platform} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {type RepliesFilter} from './utils'

export function RepliesDropdown({
  value,
  onChange,
}: {
  value: RepliesFilter
  onChange: (value: RepliesFilter) => void
}) {
  const {t: l} = useLingui()

  const options: {value: RepliesFilter; label: string}[] = [
    {value: 'all', label: l`Posts and replies`},
    {value: 'none', label: l`No replies`},
    {value: 'only', label: l`Only replies`},
  ]
  const currentLabel = options.find(o => o.value === value)?.label ?? l`All`

  return (
    <Menu.Root>
      <Menu.Trigger
        label={l`Include posts and/or replies (currently: ${currentLabel})`}>
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
          <Trans>Include these results</Trans>
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
