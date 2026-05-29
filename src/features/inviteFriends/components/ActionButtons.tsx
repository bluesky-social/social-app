import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {StackedButton} from '#/components/Button'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {Camera_Stroke2_Corner0_Rounded as CameraIcon} from '#/components/icons/Camera'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'

export function ActionButtons({
  onShare,
  onDownload,
  onScan,
}: {
  onShare: () => void
  onDownload: () => void
  onScan: () => void
}) {
  const {t: l} = useLingui()
  return (
    <View style={[a.flex_row, a.justify_center, a.w_full, {gap: 12}]}>
      <StackedButton
        label={l({message: 'Share invite link'})}
        color="primary_subtle"
        icon={ShareIcon}
        onPress={onShare}
        style={[a.flex_1]}>
        {l`Share link`}
      </StackedButton>
      <StackedButton
        label={l({message: 'Download invite QR code'})}
        color="primary_subtle"
        icon={DownloadIcon}
        onPress={onDownload}
        style={[a.flex_1]}>
        {l`Download`}
      </StackedButton>
      <StackedButton
        label={l({message: 'Open QR scanner'})}
        color="primary_subtle"
        icon={CameraIcon}
        onPress={onScan}
        style={[a.flex_1]}>
        {l`Scan`}
      </StackedButton>
    </View>
  )
}
