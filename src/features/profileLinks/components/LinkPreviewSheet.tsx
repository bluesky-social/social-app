import {View} from 'react-native'
import {setStringAsync} from 'expo-clipboard'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Toast from '#/components/Toast'
import {type ProfileLink} from '../types'
import {LinkDestination} from './LinkDestination'

/**
 * Opened by long-pressing a link: shows the full destination before anyone
 * leaves Bluesky, plus copy and report.
 */
export function LinkPreviewSheet({
  control,
  link,
  onOpen,
  onReport,
}: {
  control: Dialog.DialogControlProps
  link: ProfileLink | null
  onOpen: (link: ProfileLink) => void
  /** Runs after the sheet closes. */
  onReport: () => void
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      {link ? (
        <LinkPreviewSheetInner
          link={link}
          onOpen={onOpen}
          onReport={onReport}
        />
      ) : null}
    </Dialog.Outer>
  )
}

function LinkPreviewSheetInner({
  link,
  onOpen,
  onReport,
}: {
  link: ProfileLink
  onOpen: (link: ProfileLink) => void
  onReport: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()

  const copy = async () => {
    await setStringAsync(link.url)
    control.close(() => {
      Toast.show(l`Link copied`, {type: 'success'})
    })
  }

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 400})}
      label={l`Link details`}>
      <View style={[a.gap_lg]}>
        <View
          style={[
            a.px_md,
            a.rounded_sm,
            a.border,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            {paddingVertical: 10},
          ]}>
          <LinkDestination url={link.url} />
        </View>
        <View style={[a.gap_sm]}>
          <Button
            testID="profileLinkPreviewOpenBtn"
            label={l`Open link`}
            accessibilityHint={l`Opens ${link.url} outside Bluesky`}
            onPress={() => control.close(() => onOpen(link))}
            size="large"
            color="primary">
            <ButtonText>
              <Trans>Open link</Trans>
            </ButtonText>
            <ButtonIcon icon={ArrowTopRightIcon} />
          </Button>
          <Button
            testID="profileLinkPreviewCopyBtn"
            label={l`Copy link`}
            onPress={() => void copy()}
            size="large"
            color="secondary">
            <ButtonIcon icon={ChainLinkIcon} />
            <ButtonText>
              <Trans>Copy link</Trans>
            </ButtonText>
          </Button>
          <Button
            testID="profileLinkPreviewReportBtn"
            label={l`Report link`}
            onPress={() => control.close(onReport)}
            size="large"
            color="negative_subtle">
            <ButtonIcon icon={WarningIcon} />
            <ButtonText>
              <Trans>Report link</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
