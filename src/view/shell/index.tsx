import React from 'react'
import {isDesktopWeb} from '../../platform/detection'
import {DesktopWebShell} from './desktop-web/shell'
import {MobileShell} from './mobile/shell'

export const Shell: React.FC = () => {
  return isDesktopWeb ? <DesktopWebShell /> : <MobileShell />
}
