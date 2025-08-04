import {type ReactNode} from 'react'
import {FocusScope as RadixFocusScope} from 'radix-ui/internal'

/*
 * The web version of the FocusScope component is a proper implementation, we
 * use this in Dialogs and such already. It's here as a convenient counterpart
 * to the hacky native solution.
 */
export function FocusScope({children}: {children: ReactNode}) {
  return (
    <RadixFocusScope.FocusScope loop asChild trapped>
      {children}
    </RadixFocusScope.FocusScope>
  )
}
