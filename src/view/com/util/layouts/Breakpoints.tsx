import React from 'react'

export const Desktop = ({}: React.PropsWithChildren<{}>) => null
export const TabletOrDesktop = ({}: React.PropsWithChildren<{}>) => null
export const Tablet = ({}: React.PropsWithChildren<{}>) => null
export const TabletOrMobile = ({children}: React.PropsWithChildren<{}>) => (
  <>{children}</>
)
export const Mobile = ({children}: React.PropsWithChildren<{}>) => (
  <>{children}</>
)
