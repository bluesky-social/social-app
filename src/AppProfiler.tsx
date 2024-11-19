import React, {Profiler} from 'react'

// Don't let it get stripped out in profiling builds (which apply production Babel preset).
const log = (global as any)['con' + 'sole'].log

function onRender(id: string, phase: string, actualDuration: number) {
  if (!__DEV__) {
    // This block of code will exist in the production build of the app.
    // However, only profiling builds of React call `onRender` so it's dead code in actual production.
    const message = `<Profiler> ${id}:${phase} ${
      actualDuration > 500
        ? '(╯°□°）╯ '
        : actualDuration > 100
        ? '[!!] '
        : actualDuration > 16
        ? '[!] '
        : ''
    }${Math.round(actualDuration)}ms`
    log(message)
  }
}

export function AppProfiler({children}: {children: React.ReactNode}) {
  return (
    <Profiler id="app" onRender={onRender}>
      {children}
    </Profiler>
  )
}
