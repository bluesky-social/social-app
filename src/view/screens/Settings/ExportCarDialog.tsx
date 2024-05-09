import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText, Link} from '#/components/Link'
import {P, Text} from '#/components/Typography'

export function ExportCarDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const {getAgent} = useAgent()

  const downloadUrl = React.useMemo(() => {
    const agent = getAgent()
    if (!currentAccount || !agent.session) {
      return '' // shouldnt ever happen
    }
    // eg: https://bsky.social/xrpc/com.atproto.sync.getRepo?did=did:plc:ewvi7nxzyoun6zhxrhs64oiz
    const url = new URL(agent.pdsUrl || agent.service)
    url.pathname = '/xrpc/com.atproto.sync.getRepo'
    url.searchParams.set('did', agent.session.did)
    return url.toString()
  }, [currentAccount, getAgent])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <View style={[a.relative, a.gap_md, a.w_full]}>
          <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
            <Trans>Export My Data</Trans>
          </Text>
          <P nativeID="dialog-description" style={[a.text_sm]}>
            <Trans>
              Your account repository, containing all public data records, can
              be downloaded as a "CAR" file. This file does not include media
              embeds, such as images, or your private data, which must be
              fetched separately.
            </Trans>
          </P>

          <Link
            variant="solid"
            color="primary"
            size="large"
            label={_(msg`Download CAR file`)}
            to={downloadUrl}
            download="repo.car">
            <ButtonText>
              <Trans>Download CAR file</Trans>
            </ButtonText>
          </Link>

          <P
            style={[
              a.py_xs,
              t.atoms.text_contrast_medium,
              a.text_sm,
              a.leading_snug,
              a.flex_1,
            ]}>
            <Trans>
              This feature is in beta. You can read more about repository
              exports in{' '}
              <InlineLinkText
                to="https://docs.bsky.app/blog/repo-export"
                style={[a.text_sm]}>
                this blogpost
              </InlineLinkText>
              .
            </Trans>
          </P>

          <View style={gtMobile && [a.flex_row, a.justify_end]}>
            <Button
              testID="doneBtn"
              variant="outline"
              color="primary"
              size={gtMobile ? 'small' : 'large'}
              onPress={() => control.close()}
              label={_(msg`Done`)}>
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>

          {!gtMobile && <View style={{height: 40}} />}
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
