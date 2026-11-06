import {useContext} from 'react'

import {DuoRightRailContext} from '#/view/shell/duoFoldedNavigation'
import {useBreakpoints} from '#/alf'
import {IS_NATIVE} from '#/env'
import {FABInner, type FABProps} from './FABInner'

export function FAB(props: FABProps) {
  const {gtMobile} = useBreakpoints()
  const rightRail = useContext(DuoRightRailContext)
  if (IS_NATIVE && gtMobile) return null
  if (rightRail && props.testID === 'composeFAB') return null
  return <FABInner {...props} />
}
