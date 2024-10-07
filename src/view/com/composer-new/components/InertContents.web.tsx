import React from 'react'

export const InertContents = ({
  inert,
  children,
}: {
  inert?: boolean
  children: React.ReactNode
}): React.ReactNode => {
  if (inert) {
    // @ts-expect-error: inert doesn't seem to exist in the typings
    return <div inert="">{children}</div>
  }

  return children
}
