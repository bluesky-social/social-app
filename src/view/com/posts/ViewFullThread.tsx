import {useMemo} from 'react'
import {View} from 'react-native'
import Svg, {Circle, Line} from 'react-native-svg'
import {AtUri} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {atoms as a, select, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export function ViewFullThread({uri}: {uri: string}) {
  const t = useTheme()
  const itemHref = useMemo(() => {
    const urip = new AtUri(uri)
    return makeProfileLink({did: urip.hostname, handle: ''}, 'post', urip.rkey)
  }, [uri])
  const {t: l} = useLingui()

  return (
    <Link
      style={[
        a.flex_row,
        {
          gap: 10,
          paddingLeft: 18,
        },
      ]}
      to={itemHref}
      label={l`View full thread`}>
      {({hovered}) => (
        <>
          <SubtleHover
            hover={hovered}
            // adjust position for visual alignment - the actual box has lots of top padding and not much bottom padding -sfn
            style={{top: 8, bottom: -5}}
          />
          <View style={[a.align_center, {width: 42}]}>
            <Svg width="4" height="40">
              <Line
                x1="2"
                y1="0"
                x2="2"
                y2="15"
                stroke={select(t.name, {
                  light: t.palette.contrast_100,
                  dim: t.palette.contrast_200,
                  dark: t.palette.contrast_200,
                })}
                strokeWidth="2"
              />
              <Circle cx="2" cy="22" r="1.5" fill={t.palette.contrast_200} />
              <Circle cx="2" cy="28" r="1.5" fill={t.palette.contrast_200} />
              <Circle cx="2" cy="34" r="1.5" fill={t.palette.contrast_200} />
            </Svg>
          </View>
          <Text
            style={[
              a.text_md,
              {color: t.palette.primary_500, paddingTop: 18, paddingBottom: 4},
            ]}>
            {/* HACKFIX: Trans isn't working after SDK 53 upgrade -sfn */}
            {l`View full thread`}
          </Text>
        </>
      )}
    </Link>
  )
}
