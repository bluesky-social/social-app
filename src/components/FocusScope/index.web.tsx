import {type ReactNode} from 'react'
import {FocusScope as RadixFocusScope} from 'radix-ui/internal'

export function FocusScope({children}: {children: ReactNode}) {
  return (
    <RadixFocusScope.FocusScope loop asChild trapped>
      {children}
    </RadixFocusScope.FocusScope>
  )
}
