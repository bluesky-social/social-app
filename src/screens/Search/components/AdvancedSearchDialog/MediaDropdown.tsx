import {Trans, useLingui} from '@lingui/react/macro'

import {platform} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {type MediaFilter} from './utils'

export function MediaDropdown({
  value,
  onChange,
}: {
  value: MediaFilter
  onChange: (value: MediaFilter) => void
}) {
  const {t: l} = useLingui()

  const options: {value: MediaFilter; label: string}[] = [
    {value: 'all', label: l`All posts`},
    {value: 'media', label: l`Only posts with media`},
    {value: 'video', label: l`Only posts with videos`},
  ]
  const currentLabel =
    options.find(o => o.value === value)?.label ?? l`All posts`

  return (
    <Menu.Root>
      <Menu.Trigger label={l`Filter by media (currently: ${currentLabel})`}>
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
          <Trans>Filter by media</Trans>
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
