import {Toaster as BurntToaster} from 'burnt/web'

import {flatten, useBreakpoints, useTheme} from '#/alf'

export function Toaster() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <BurntToaster
      theme={t.scheme}
      toastOptions={{style: flatten([t.atoms.bg])}}
      position={gtMobile ? 'bottom-left' : 'top-center'}
    />
  )
}
