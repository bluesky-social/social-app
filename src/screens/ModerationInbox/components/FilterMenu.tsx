import {Pressable} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'

type ReportFilter = 'all' | 'pending' | 'resolved' | 'unread'

export function FilterMenu({
  filter,
  setFilter,
}: {
  filter: ReportFilter
  setFilter: React.Dispatch<React.SetStateAction<ReportFilter>>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const labels: Record<ReportFilter, string> = {
    all: l({context: 'moderation-report-filter', message: 'All'}),
    pending: l({
      context: 'moderation-report-filter',
      message: 'Under review',
    }),
    resolved: l({context: 'moderation-report-filter', message: 'Resolved'}),
    unread: l({context: 'moderation-report-filter', message: 'Unread'}),
  }
  const options: {value: ReportFilter; label: string}[] = [
    {value: 'all', label: labels.all},
    {value: 'pending', label: labels.pending},
    {value: 'resolved', label: labels.resolved},
    {value: 'unread', label: labels.unread},
  ]
  const currentLabel = labels[filter]

  return (
    <Menu.Root>
      <Menu.Trigger
        label={l`Filter moderation reports (currently: ${currentLabel})`}>
        {({props}) => (
          <Pressable
            {...props}
            style={[a.flex_row, a.align_center, a.justify_center, a.gap_xs]}>
            <Text style={[a.text_md, a.font_medium]}>{currentLabel}</Text>
            <ChevronDownIcon size="xs" style={[t.atoms.text]} />
          </Pressable>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          {options.map(option => (
            <Menu.Item
              key={option.value}
              label={option.label}
              onPress={() => setFilter(option.value)}>
              <Menu.ItemText>{option.label}</Menu.ItemText>
              <Menu.ItemRadio selected={filter === option.value} />
            </Menu.Item>
          ))}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
