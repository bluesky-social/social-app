import React from 'react'
import MediaQuery from 'react-responsive'

export const Desktop = ({children}: React.PropsWithChildren<{}>) => (
  <MediaQuery minWidth={1224}>{children}</MediaQuery>
)
export const TabletOrDesktop = ({children}: React.PropsWithChildren<{}>) => (
  <MediaQuery minWidth={800}>{children}</MediaQuery>
)
export const Tablet = ({children}: React.PropsWithChildren<{}>) => (
  <MediaQuery minWidth={800} maxWidth={1224}>
    {children}
  </MediaQuery>
)
export const TabletOrMobile = ({children}: React.PropsWithChildren<{}>) => (
  <MediaQuery maxWidth={1224}>{children}</MediaQuery>
)
export const Mobile = ({children}: React.PropsWithChildren<{}>) => (
  <MediaQuery maxWidth={800}>{children}</MediaQuery>
)
