import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon,
} from '#/components/icons/Chevron'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Menu from '#/components/Menu'
import {AutocompleteInput} from './AutocompleteInput'
import {ClearableInput} from './ClearableInput'
import {useFilterFieldLabels} from './hooks'
import {type AdvancedFilter, FILTER_FIELDS, HANDLE_FIELDS} from './utils'

export function FilterBlock({
  filter,
  onChange,
  onRemove,
  onSubmitEditing,
}: {
  filter: AdvancedFilter
  onChange: (patch: Partial<AdvancedFilter>) => void
  onRemove: () => void
  onSubmitEditing?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const labels = useFilterFieldLabels()

  return (
    <View
      style={[
        a.gap_sm,
        a.p_md,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.flex_row, a.gap_sm, a.align_center]}>
        <Menu.Root>
          <Menu.Trigger
            label={l`Include or exclude matching posts (currently: ${
              filter.mode === 'exclude'
                ? l({message: 'Exclude', comment: 'Advanced search filter'})
                : l({message: 'Include', comment: 'Advanced search filter'})
            })`}>
            {({props}) => (
              <Button
                {...props}
                label={props.accessibilityLabel}
                size="small"
                color="secondary">
                <ButtonText>
                  {filter.mode === 'exclude'
                    ? l({message: 'Exclude', comment: 'Advanced search filter'})
                    : l({
                        message: 'Include',
                        comment: 'Advanced search filter',
                      })}
                </ButtonText>
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
            <Menu.Group>
              <Menu.Item
                label={l({
                  message: 'Include',
                  comment: 'Advanced search filter',
                })}
                onPress={() => onChange({mode: 'include'})}>
                <Menu.ItemText>
                  <Trans>Include</Trans>
                </Menu.ItemText>
                <Menu.ItemRadio selected={filter.mode === 'include'} />
              </Menu.Item>
              <Menu.Item
                label={l({
                  message: 'Exclude',
                  comment: 'Advanced search filter',
                })}
                onPress={() => onChange({mode: 'exclude'})}>
                <Menu.ItemText>
                  <Trans>Exclude</Trans>
                </Menu.ItemText>
                <Menu.ItemRadio selected={filter.mode === 'exclude'} />
              </Menu.Item>
            </Menu.Group>
          </Menu.Outer>
        </Menu.Root>

        <Menu.Root>
          <Menu.Trigger
            label={l`Select filter type (currently: ${labels[filter.field].title})`}>
            {({props}) => (
              <Button
                {...props}
                label={props.accessibilityLabel}
                size="small"
                color="secondary">
                <ButtonText>{labels[filter.field].title}</ButtonText>
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
            <Menu.Group>
              {FILTER_FIELDS.map(field => (
                <Menu.Item
                  key={field}
                  label={labels[field].title}
                  // Switching the field type clears any text entered for the
                  // previous type, since values rarely carry over meaningfully
                  // (e.g. a handle is not a domain). Changing include/exclude
                  // mode leaves the text intact - it's the same field.
                  onPress={() => onChange({field, value: ''})}>
                  <Menu.ItemText>{labels[field].title}</Menu.ItemText>
                  <Menu.ItemRadio selected={filter.field === field} />
                </Menu.Item>
              ))}
            </Menu.Group>
          </Menu.Outer>
        </Menu.Root>

        <View style={[a.flex_1]} />

        <Button
          label={l({
            message: 'Remove filter',
            comment: 'Advanced search filter',
          })}
          size="small"
          color="secondary"
          shape="round"
          onPress={onRemove}>
          <ButtonIcon icon={XIcon} />
        </Button>
      </View>

      {HANDLE_FIELDS.has(filter.field) ? (
        <AutocompleteInput
          // Remount on field-type change so the input resets to the cleared
          // value; mode changes keep the same field and so preserve the text.
          key={filter.field}
          label={labels[filter.field].label}
          value={filter.value}
          onChangeText={text => onChange({value: text})}
          onSubmitEditing={onSubmitEditing}
        />
      ) : (
        <ClearableInput
          // The input is uncontrolled (defaultValue), so remount on field-type
          // change to reset it; mode changes keep the same field and text.
          key={filter.field}
          label={labels[filter.field].label}
          defaultValue={filter.value}
          onChangeText={text => onChange({value: text})}
          onSubmitEditing={onSubmitEditing}
        />
      )}
    </View>
  )
}
