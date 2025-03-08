import {Toaster as BurntToaster} from 'burnt/web'

import {useBreakpoints, useTheme} from '#/alf'

export function Toaster() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <BurntToaster
      theme={t.scheme}
      position={gtMobile ? 'bottom-left' : 'top-center'}
    />
  )
}
