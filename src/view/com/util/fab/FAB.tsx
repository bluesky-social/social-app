import {useBreakpoints} from '#/alf'
import {IS_IPAD} from '#/env'
import {FABInner, type FABProps} from './FABInner'

export function FAB(props: FABProps) {
  const {gtMobile} = useBreakpoints()
  if (IS_IPAD && gtMobile) return null
  return <FABInner {...props} />
}
