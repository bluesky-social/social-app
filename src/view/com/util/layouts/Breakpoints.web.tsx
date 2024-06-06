import {PropsWithChildren} from 'react'
import MediaQuery from 'react-responsive'

export const Desktop = ({children}: PropsWithChildren<{}>) => (
  <MediaQuery minWidth={1300}>{children}</MediaQuery>
)
export const TabletOrDesktop = ({children}: PropsWithChildren<{}>) => (
  <MediaQuery minWidth={800}>{children}</MediaQuery>
)
export const Tablet = ({children}: PropsWithChildren<{}>) => (
  <MediaQuery minWidth={800} maxWidth={1300 - 1}>
    {children}
  </MediaQuery>
)
export const TabletOrMobile = ({children}: PropsWithChildren<{}>) => (
  <MediaQuery maxWidth={1300 - 1}>{children}</MediaQuery>
)
export const Mobile = ({children}: PropsWithChildren<{}>) => (
  <MediaQuery maxWidth={800 - 1}>{children}</MediaQuery>
)
