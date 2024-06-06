import {PropsWithChildren} from 'react'

export const Desktop = ({}: PropsWithChildren<{}>) => null
export const TabletOrDesktop = ({}: PropsWithChildren<{}>) => null
export const Tablet = ({}: PropsWithChildren<{}>) => null
export const TabletOrMobile = ({children}: PropsWithChildren<{}>) => (
  <>{children}</>
)
export const Mobile = ({children}: PropsWithChildren<{}>) => <>{children}</>
