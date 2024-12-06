import React from 'react'

import {atoms as a, useBreakpoints, ViewStyleProp} from '#/alf'

export function useGutterStyles({
  top,
  bottom,
}: {
  top?: boolean
  bottom?: boolean
} = {}) {
  const {gtMobile} = useBreakpoints()
  return React.useMemo<ViewStyleProp['style']>(() => {
    return [
      a.px_lg,
      top && a.pt_md,
      bottom && a.pb_md,
      gtMobile && [a.px_xl, top && a.pt_lg, bottom && a.pb_lg],
    ]
  }, [gtMobile, top, bottom])
}
