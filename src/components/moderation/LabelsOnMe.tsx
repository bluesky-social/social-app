import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, ComAtprotoLabelDefs} from '@atproto/api'
import {msg, Plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonSize, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  LabelsOnMeDialog,
  useLabelsOnMeDialogControl,
} from '#/components/moderation/LabelsOnMeDialog'

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
  const control = useLabelsOnMeDialogControl()

  if (!labels || !currentAccount) {
    return null
  }
  labels = labels.filter(l => !l.val.startsWith('!'))
  if (!labels.length) {
    return null
  }

  return (
    <View style={[a.flex_row, style]}>
      <LabelsOnMeDialog control={control} subject={details} labels={labels} />

      <Button
        variant="solid"
        color="secondary"
        size={size || 'small'}
        label={_(msg`View information about these labels`)}
        onPress={() => {
          control.open()
        }}>
        <ButtonIcon position="left" icon={CircleInfo} />
        <ButtonText style={[a.leading_snug]}>
          {isAccount ? (
            <Plural
              value={labels.length}
              one="# label has been placed on this account"
              other="# labels have been placed on this account"
            />
          ) : (
            <Plural
              value={labels.length}
              one="# label has been placed on this content"
              other="# labels have been placed on this content"
            />
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
