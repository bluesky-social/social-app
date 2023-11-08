import React from 'react'
import {Provider as LanguagesProvider} from './languages'

export {useLanguagePrefs, useSetLanguagePrefs} from './languages'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return <LanguagesProvider>{children}</LanguagesProvider>
}
