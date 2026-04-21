import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import * as ContextMenu from '#/components/ContextMenu'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {CircleChromeButton} from './CircleChromeButton'

type Props = {
  onPressShare: () => void
  onPressSave: () => void
}

export function ImageMenu({onPressShare, onPressSave}: Props) {
  const {_} = useLingui()

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        label={_(msg`Image options`)}
        contentLabel={_(msg`Image options`)}>
        {triggerProps => {
          if (!triggerProps.IS_NATIVE) {
            // ImageMenu is native-only; web uses Lightbox.web.tsx's own menu
            return null
          }
          return (
            <CircleChromeButton
              icon={DotsIcon}
              label={_(msg`Image options`)}
              onPress={() => triggerProps.control.open('full')}
            />
          )
        }}
      </ContextMenu.Trigger>

      <ContextMenu.Outer align="left">
        <ContextMenu.Item label={_(msg`Share image`)} onPress={onPressShare}>
          <ContextMenu.ItemIcon icon={ShareIcon} />
          <ContextMenu.ItemText>{_(msg`Share image`)}</ContextMenu.ItemText>
        </ContextMenu.Item>
        <ContextMenu.Item label={_(msg`Save image`)} onPress={onPressSave}>
          <ContextMenu.ItemIcon icon={DownloadIcon} />
          <ContextMenu.ItemText>{_(msg`Save image`)}</ContextMenu.ItemText>
        </ContextMenu.Item>
      </ContextMenu.Outer>
    </ContextMenu.Root>
  )
}
