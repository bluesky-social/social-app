import {atoms as a, style as s} from '../theme/index.js'

export function Box({
  children,
  cx = [],
}: {
  children?: React.ReactNode
  cx?: (Record<string, any> | undefined)[]
}) {
  return <div style={s([a.flex, a.flex_col, ...cx])}>{children}</div>
}
