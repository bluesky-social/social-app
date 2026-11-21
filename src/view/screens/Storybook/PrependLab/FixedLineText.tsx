import {type StyleProp, type TextStyle} from 'react-native'

import {Text} from '#/components/Typography'

/**
 * Text that always takes exactly `lines` lines, whatever it says: it is
 * padded with `lines - 1` extra lines and then capped at `lines`, so short
 * text still fills them and long text is truncated.
 *
 * The lab's header and readout are built from these so that nothing they
 * display can change the list's frame. A readout line that re-wrapped on a
 * poll would resize the list viewport, which moves the scroll position and
 * makes VirtualizedList re-window: the lab would be feeding the very thing
 * under test.
 */
export function FixedLineText({
  lines = 1,
  style,
  children,
}: {
  lines?: number
  style?: StyleProp<TextStyle>
  children: React.ReactNode
}) {
  return (
    <Text style={style} numberOfLines={lines}>
      {children}
      {'\n '.repeat(lines - 1)}
    </Text>
  )
}
