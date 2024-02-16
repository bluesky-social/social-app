import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, ComAtprotoLabelDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSession} from '#/state/session'

import {atoms as a} from '#/alf'
import {Button, ButtonText, ButtonIcon, ButtonSize} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {useOpenGlobalDialog} from '#/components/dialogs'
import {LabelsOnMeDialog} from '#/components/dialogs/LabelsOnMe'

export function LabelsOnMe({
  details,
  labels,
  size,
  style,
}: {
  details: {did: string} | {uri: string; cid: string}
  labels: ComAtprotoLabelDefs.Label[] | undefined
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const isAccount = 'did' in details
  const openDialog = useOpenGlobalDialog()

  if (!labels || !currentAccount) {
    return null
  }
  labels = labels.filter(
    l => !l.val.startsWith('!') && l.src !== currentAccount.did,
  )
  if (!labels.length) {
    return null
  }

  return (
    <View style={[a.flex_row, style]}>
      <Button
        variant="solid"
        color="secondary"
        size={size || 'small'}
        label={_(msg`View information about these labels`)}
        onPress={() => {
          openDialog(LabelsOnMeDialog, {
            subject: details,
            labels: labels!,
          })
        }}>
        <ButtonIcon position="left" icon={CircleInfo} />
        <ButtonText>
          {labels.length}{' '}
          {labels.length === 1 ? (
            <Trans>
              label has been placed on this {isAccount ? 'account' : 'content'}
            </Trans>
          ) : (
            <Trans>
              labels have been placed on this{' '}
              {isAccount ? 'account' : 'content'}
            </Trans>
          )}
        </ButtonText>
      </Button>
    </View>
  )
}

export function LabelsOnMyPost({
  post,
  style,
}: {
  post: AppBskyFeedDefs.PostView
  style?: StyleProp<ViewStyle>
}) {
  const {currentAccount} = useSession()
  if (post.author.did !== currentAccount?.did) {
    return null
  }
  return (
    <LabelsOnMe details={post} labels={post.labels} size="tiny" style={style} />
  )
}
