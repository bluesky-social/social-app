import React from 'react'

let Twemoji = ({children}: {children: string}): React.ReactNode => children

Twemoji = React.memo(Twemoji)
export {Twemoji}
