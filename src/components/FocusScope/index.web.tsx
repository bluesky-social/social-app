import {FocusScope as RadixFocusScope} from '@radix-ui/react-focus-scope'

/*
 * The web version of the FocusScope component is a proper implementation, we
 * use this in Dialogs and such already. It's here as a convenient counterpart
 * to the hacky native solution.
 */
export function FocusScope({children}: {children: React.ReactNode}) {
  return (
    <RadixFocusScope loop asChild trapped>
      {children}
    </RadixFocusScope>
  )
}
