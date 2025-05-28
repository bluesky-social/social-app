import {View} from 'react-native'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {type PostThreadParams, type Slice} from '#/state/queries/usePostThread'
import {
  LINEAR_AVI_WIDTH,
  REPLY_LINE_WIDTH,
  TREE_AVI_WIDTH,
  TREE_INDENT,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {CirclePlus_Stroke2_Corner0_Rounded as CirclePlus} from '#/components/icons/CirclePlus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function ReadMore({
  item,
  view,
}: {
  item: Extract<Slice, {type: 'readMore'}>
  view: PostThreadParams['view']
}) {
  const t = useTheme()
  const {_} = useLingui()
  const isTreeView = view === 'tree'
  const indent = Math.max(0, item.indent - 1)

  const spacers = isTreeView
    ? Array.from(Array(indent)).map((_, n: number) => (
        <View
          key={`${item.key}-padding-${n}`}
          style={[
            t.atoms.border_contrast_low,
            {
              borderRightWidth: REPLY_LINE_WIDTH,
              width: TREE_INDENT + TREE_AVI_WIDTH / 2,
              left: 1,
            },
          ]}
        />
      ))
    : null

  return (
    <View style={[a.flex_row]}>
      {spacers}
      <View
        style={[
          t.atoms.border_contrast_low,
          {
            marginLeft: isTreeView
              ? TREE_INDENT + TREE_AVI_WIDTH / 2 - 1
              : (LINEAR_AVI_WIDTH - REPLY_LINE_WIDTH) / 2 + 16,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderBottomLeftRadius: a.rounded_sm.borderRadius,
            height: '50%',
            width: isTreeView ? TREE_INDENT : LINEAR_AVI_WIDTH / 2 + 10,
          },
        ]}
      />
      <Link
        label={_(msg`Read more replies`)}
        to={makeProfileLink(
          {
            did: item.nextAnchorUri.host,
            handle: item.nextAnchor.value.post.author.handle,
          },
          'post',
          item.nextAnchorUri.rkey,
        )}
        style={[a.pt_sm, a.pb_md, a.gap_xs]}>
        {({hovered, pressed}) => {
          return (
            <>
              <CirclePlus fill={t.atoms.text_contrast_high.color} width={18} />
              <Text
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  (hovered || pressed) && a.underline,
                ]}>
                <Trans>
                  Read {item.replyCount} more{' '}
                  <Plural one="reply" other="replies" value={item.replyCount} />
                </Trans>
              </Text>
            </>
          )
        }}
      </Link>
    </View>
  )
}
