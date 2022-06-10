import React from 'react'
import {SafeAreaView} from 'react-native'
import {isDesktopWeb} from './detection'
import {DesktopWebShell} from './desktop-web/shell'

export const Shell: React.FC = ({children}) => {
  return isDesktopWeb ? (
    <DesktopWebShell>{children}</DesktopWebShell>
  ) : (
    <SafeAreaView>{children}</SafeAreaView>
  )
}
