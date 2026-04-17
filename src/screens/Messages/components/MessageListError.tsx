import {useMemo} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type ConvoItem, ConvoItemError} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function MessageListError({item}: {item: ConvoItem & {type: 'error'}}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {description, help, cta} = useMemo(() => {
    return {
      [ConvoItemError.FirehoseFailed]: {
        description: l`This chat was disconnected`,
        help: l`Press to attempt reconnection`,
        cta: l`Reconnect`,
      },
      [ConvoItemError.HistoryFailed]: {
        description: l`Failed to load past messages`,
        help: l`Press to retry`,
        cta: l`Retry`,
      },
    }[item.code]
  }, [l, item.code])

  return (
    <View style={[a.my_md, a.w_full, a.flex_row, a.justify_center]}>
      <View
        style={[
          a.flex_1,
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_sm,
          {maxWidth: 400},
        ]}>
        <CircleInfo size="sm" fill={t.palette.negative_400} />

        <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
          {description}
          {item.retry && (
            <>
              &middot;{' '}
              <InlineLinkText
                label={help}
                {...createStaticClick(() => {
                  item.retry?.()
                })}>
                {cta}
              </InlineLinkText>
            </>
          )}
        </Text>
      </View>
    </View>
  )
}
