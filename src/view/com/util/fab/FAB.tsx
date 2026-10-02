import {useBreakpoints} from '#/alf'
import {IS_NATIVE} from '#/env'
import {FABInner, type FABProps} from './FABInner'

export function FAB(props: FABProps) {
  const {gtMobile} = useBreakpoints()
  if (IS_NATIVE && gtMobile) return null
  return <FABInner {...props} />
}
