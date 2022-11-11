if (typeof process.env.REACT_APP_BUILD !== 'string') {
  throw new Error('ENV: No env provided')
}
if (!['dev', 'staging', 'prod'].includes(process.env.REACT_APP_BUILD)) {
  throw new Error(
    `ENV: Env must be "dev", "staging", or "prod," got "${process.env.REACT_APP_BUILD}"`,
  )
}

export const BUILD = process.env.REACT_APP_BUILD
