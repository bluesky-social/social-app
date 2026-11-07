import {useLingui} from '@lingui/react/macro'

import {ThemeProvider} from '#/alf'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import * as Menu from '#/components/Menu'
import {CircleChromeButton} from './CircleChromeButton'

type Props = {
  onPressShare: () => void
  onPressSave: () => void
}

export function ImageMenu({onPressShare, onPressSave}: Props) {
  const {t: l} = useLingui()

  return (
    // The lightbox is always dark, so its menu is too.
    <ThemeProvider theme="dark">
      <Menu.Root inline>
        <Menu.Trigger label={l`Image options`}>
          {({props}) => (
            <CircleChromeButton
              icon={DotsIcon}
              iconStyle={{transform: [{rotate: '90deg'}]}}
              label={props.accessibilityLabel}
              onPress={props.onPress}
            />
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Item label={l`Share image`} onPress={onPressShare}>
            <Menu.ItemText>{l`Share image`}</Menu.ItemText>
            <Menu.ItemIcon icon={ShareIcon} />
          </Menu.Item>
          <Menu.Item label={l`Save image`} onPress={onPressSave}>
            <Menu.ItemText>{l`Save image`}</Menu.ItemText>
            <Menu.ItemIcon icon={DownloadIcon} />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </ThemeProvider>
  )
}
