import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {saveBytesToDisk} from '#/lib/media/manip'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function ExportCarDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const [loading, setLoading] = useState<'repo' | 'chat' | false>(false)

  const download = useCallback(async () => {
    if (!agent.session) {
      return // shouldn't ever happen
    }
    try {
      setLoading('repo')
      const did = agent.session.did
      const downloadRes = await agent.com.atproto.sync.getRepo({did})
      const saveRes = await saveBytesToDisk(
        'repo.car',
        downloadRes.data,
        downloadRes.headers['content-type'] || 'application/vnd.ipld.car',
      )

      if (saveRes) {
        Toast.show(l`File saved successfully!`)
      }
    } catch (e) {
      logger.error('Error occurred while downloading CAR file', {message: e})
      Toast.show(l`Error occurred while saving file`, {type: 'error'})
    } finally {
      setLoading(false)
    }
  }, [l, agent])

  const downloadChatData = useCallback(async () => {
    if (!agent.session) {
      return
    }
    try {
      setLoading('chat')
      // Using raw fetch because the XRPC client incorrectly tries to JSON-parse
      // application/jsonl responses (substring match on application/json).
      const res = await agent.sessionManager.fetchHandler(
        '/xrpc/chat.bsky.actor.exportAccountData',
        {headers: DM_SERVICE_HEADERS},
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = new Uint8Array(await res.arrayBuffer())
      const saveRes = await saveBytesToDisk(
        'chat.jsonl',
        data,
        res.headers.get('content-type') || 'application/jsonl',
      )

      if (saveRes) {
        Toast.show(l`File saved successfully!`)
      }
    } catch (e) {
      logger.error('Error occurred while downloading chat data', {message: e})
      Toast.show(l`Error occurred while saving file`, {type: 'error'})
    } finally {
      setLoading(false)
    }
  }, [l, agent])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title"
        style={web({maxWidth: 500})}>
        <View style={[a.relative, a.w_full]}>
          <Text
            nativeID="dialog-title"
            style={[a.mb_sm, a.text_2xl, a.font_bold]}>
            <Trans>Export my profile data</Trans>
          </Text>
          <Text
            nativeID="dialog-description"
            style={[
              a.mb_lg,
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_high,
            ]}>
            <Trans>
              Your account repository, containing all public data records, can
              be downloaded as a "CAR" file. This file does not include media
              embeds, such as images, or your private data, which must be
              fetched separately.
            </Trans>
          </Text>

          <Button
            color="primary"
            size="large"
            label={l`Download CAR file`}
            disabled={!!loading}
            onPress={() => void download()}>
            <ButtonIcon icon={loading === 'repo' ? Loader : DownloadIcon} />
            <ButtonText>
              <Trans context="button">Download CAR file</Trans>
            </ButtonText>
          </Button>

          <Text
            nativeID="dialog-title"
            style={[a.mt_2xl, a.mb_sm, a.text_2xl, a.font_bold]}>
            <Trans>Export my chat data</Trans>
          </Text>
          <Text
            style={[
              a.mb_lg,
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_high,
            ]}>
            <Trans>
              You can also download your chat data as a "JSONL" file. This file
              only includes chat messages that you have sent and does not
              include chat messages that you have received.
            </Trans>
          </Text>

          <Button
            color="primary"
            size="large"
            label={l`Download chat data`}
            disabled={!!loading}
            onPress={() => void downloadChatData()}>
            <ButtonIcon icon={loading === 'chat' ? Loader : DownloadIcon} />
            <ButtonText>
              <Trans context="button">Download chat data</Trans>
            </ButtonText>
          </Button>

          <Text
            style={[
              a.flex_1,
              a.mt_2xl,
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>
              This feature is in beta. You can read more about repository
              exports in{' '}
              <InlineLinkText
                label={l`View blogpost for more details`}
                to="https://docs.bsky.app/blog/repo-export"
                style={[a.text_sm]}>
                this blogpost
              </InlineLinkText>
              .
            </Trans>
          </Text>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
