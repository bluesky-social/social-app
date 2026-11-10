import {useState} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {type app} from '#/lexicons'

export function PostViewCount({post}: {post: app.bsky.feed.defs.PostView}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {flags, state} = useAgeAssurance()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const formatCount = useFormatPostStatCount()
  const count = post.viewCount
  const explanation = l`This view count estimates how often your post was seen in Bluesky’s apps. Only you can see this number.`

  if (
    currentAccount?.did !== post.author.did ||
    state.isLoading ||
    !flags.hasDeclaredAge ||
    flags.isDeclaredUnderAdultAge ||
    count === undefined ||
    !Number.isSafeInteger(count) ||
    count < 100
  ) {
    return null
  }

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Text aria-hidden style={[a.text_sm, t.atoms.text_contrast_medium]}>
        ·
      </Text>
      <Tooltip.Outer
        color="outlined"
        visible={tooltipVisible}
        onVisibleChange={setTooltipVisible}>
        <Tooltip.Target>
          <Button
            testID="postViewCount"
            label={l({
              message: plural(count, {one: '# view', other: '# views'}),
            })}
            accessibilityHint={l`Shows how view counts work`}
            accessibilityState={{expanded: tooltipVisible}}
            onPress={() => setTooltipVisible(!tooltipVisible)}>
            {({hovered}) => {
              const color = tooltipVisible
                ? {color: t.palette.primary_500}
                : hovered
                  ? t.atoms.text
                  : t.atoms.text_contrast_medium
              return (
                <Text style={[a.text_sm, color]}>
                  <Trans comment="Post view count. The number is bold and may use compact notation, such as 1.8K.">
                    <Text style={[a.text_sm, a.font_semi_bold, color]}>
                      {formatCount(count)}
                    </Text>{' '}
                    <Plural value={count} one="view" other="views" />
                  </Trans>
                </Text>
              )
            }}
          </Button>
        </Tooltip.Target>
        <Tooltip.Content label={explanation} targetHandlesToggle>
          <Text
            style={[a.text_sm, a.leading_snug, a.text_center, t.atoms.text]}>
            {explanation}
          </Text>
        </Tooltip.Content>
      </Tooltip.Outer>
    </View>
  )
}
