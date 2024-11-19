import React from 'react'
import {StyleSheet, View} from 'react-native'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'

export function ViewFullThread({uri}: {uri: string}) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const pal = usePalette('default')
  const itemHref = React.useMemo(() => {
    const urip = new AtUri(uri)
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [uri])

  return (
    <Link
      style={[styles.viewFullThread]}
      href={itemHref}
      asAnchor
      noFeedback
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}>
      <SubtleWebHover
        hover={hover}
        // adjust position for visual alignment - the actual box has lots of top padding and not much bottom padding -sfn
        style={{top: 8, bottom: -5}}
      />
      <View style={styles.viewFullThreadDots}>
        <Svg width="4" height="40">
          <Line
            x1="2"
            y1="0"
            x2="2"
            y2="15"
            stroke={pal.colors.replyLine}
            strokeWidth="2"
          />
          <Circle cx="2" cy="22" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="28" r="1.5" fill={pal.colors.replyLineDot} />
          <Circle cx="2" cy="34" r="1.5" fill={pal.colors.replyLineDot} />
        </Svg>
      </View>

      <Text type="md" style={[pal.link, {paddingTop: 18, paddingBottom: 4}]}>
        <Trans>View full thread</Trans>
      </Text>
    </Link>
  )
}

const styles = StyleSheet.create({
  viewFullThread: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 18,
  },
  viewFullThreadDots: {
    width: 42,
    alignItems: 'center',
  },
})
