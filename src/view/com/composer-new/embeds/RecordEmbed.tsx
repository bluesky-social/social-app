import React from 'react'
import {StyleProp, TouchableOpacity, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {s} from '#/lib/styles'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useRecordMetaQuery} from '#/state/queries/record-meta'
import {atoms as a, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {FeedSourceCardLoaded} from '../../feeds/FeedSourceCard'
import {QuoteEmbed} from '../../util/post-embeds/QuoteEmbed'
import {InertContents} from '../components/InertContents'
import {ComposerAction, PostRecordEmbed} from '../state'

export const RecordEmbed = ({
  active,
  postId,
  embed,
  dispatch,
}: {
  active: boolean
  postId: string
  embed: PostRecordEmbed
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const {_} = useLingui()

  const {data: preferences} = usePreferencesQuery()
  const {data: record, error} = useRecordMetaQuery(embed)

  const canRemove = embed.kind !== 'post' || !embed.data

  const onRemove = () => {
    dispatch({type: 'embed_remove_record', postId})
  }

  return (
    <View>
      {/* @todo: what to display on error? */}
      {
        error ? null : !record ? (
          <Container>
            <Loader size="xl" />
          </Container>
        ) : record.kind === 'feed' ? (
          <InertContents inert>
            {/* @todo: set a border on <FeedSourceCardLoaded> */}
            <FeedSourceCardLoaded
              feedUri={record.data.uri}
              feed={record.data}
              preferences={preferences}
              showLikes
            />
          </InertContents>
        ) : record.kind === 'post' ? (
          <InertContents inert>
            <QuoteEmbed quote={record.data} />
          </InertContents>
        ) : null /* TODO */
      }

      {active && canRemove && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 16,
            right: 10,
            height: 36,
            width: 36,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Remove link`)}
          accessibilityHint={_(msg`Remove link embed pointing to ${embed.uri}`)}
          onAccessibilityEscape={onRemove}>
          <FontAwesomeIcon size={18} icon="xmark" style={s.white} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const Container = ({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) => {
  const t = useTheme()

  return (
    <View
      style={[
        a.mt_sm,
        a.rounded_sm,
        a.border,
        a.align_center,
        a.justify_center,
        a.py_5xl,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_medium,
        style,
      ]}>
      {children}
    </View>
  )
}
