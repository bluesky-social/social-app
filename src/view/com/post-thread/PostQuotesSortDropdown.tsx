import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {type QuotesSort} from '#/state/queries/post-quotes'
import {Button, ButtonIcon} from '#/components/Button'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import * as Menu from '#/components/Menu'

export function PostQuotesSortDropdown({
  sort,
  setSort,
}: {
  sort: QuotesSort
  setSort: (sort: QuotesSort) => void
}): React.ReactNode {
  const {_} = useLingui()
  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Quote sorting`)}>
        {({props}) => (
          <Button
            label={_(msg`Quote sorting`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            hitSlop={HITSLOP_10}
            {...props}>
            <ButtonIcon icon={SettingsSlider} size="md" />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>
          <Trans>Sort quotes by</Trans>
        </Menu.LabelText>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Most liked`)}
            onPress={() => {
              setSort('top')
            }}>
            <Menu.ItemText>
              <Trans>Most liked</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sort === 'top'} />
          </Menu.Item>
          <Menu.Item
            label={_(msg`Newest`)}
            onPress={() => {
              setSort('latest')
            }}>
            <Menu.ItemText>
              <Trans>Newest</Trans>
            </Menu.ItemText>
            <Menu.ItemRadio selected={sort === 'latest'} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
