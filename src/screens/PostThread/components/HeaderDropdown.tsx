import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {type ThreadPreferences} from '#/state/queries/preferences/useThreadPreferences'
import {Button, ButtonIcon} from '#/components/Button'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import * as Menu from '#/components/Menu'
import {useAnalytics} from '#/analytics'

export function HeaderDropdown({
  sort,
  view,
  setSort,
  setView,
}: Pick<
  ThreadPreferences,
  'sort' | 'setSort' | 'view' | 'setView'
>): React.ReactNode {
  const ax = useAnalytics()
  const {_} = useLingui()
  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Thread options`)}>
        {({props: {onPress, ...props}}) => (
          <Button
            label={_(msg`Thread options`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            hitSlop={HITSLOP_10}
            onPress={() => {
              ax.metric('thread:click:headerMenuOpen', {})
              onPress()
            }}
            {...props}>
            <ButtonIcon icon={SettingsSlider} size="md" />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Show replies as</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Linear`)}
            onPress={() => {
              setView('linear')
            }}>
            <Menu.ItemText>
              <Trans>Linear</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={view === 'linear'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Threaded`)}
            onPress={() => {
              setView('tree')
            }}>
            <Menu.ItemText>
              <Trans>Threaded</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={view === 'tree'} />
          </Menu.Item>
        </Menu.Group>
        <Menu.Divider />
        <Menu.LabelText>
          <Trans>Reply sorting</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Top replies first`)}
            onPress={() => {
              setSort('top')
            }}>
            <Menu.ItemText>
              <Trans>Top replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sort === 'top'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Oldest replies first`)}
            onPress={() => {
              setSort('oldest')
            }}>
            <Menu.ItemText>
              <Trans>Oldest replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sort === 'oldest'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Newest replies first`)}
            onPress={() => {
              setSort('newest')
            }}>
            <Menu.ItemText>
              <Trans>Newest replies first</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sort === 'newest'} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
