// @ts-ignore types not available -prf
import {REACT_APP_BUILD} from '@env'

if (typeof REACT_APP_BUILD !== 'string') {
  throw new Error('ENV: No env provided')
}
if (!['dev', 'staging', 'prod'].includes(REACT_APP_BUILD)) {
  throw new Error(
    `ENV: Env must be "dev", "staging", or "prod," got "${REACT_APP_BUILD}"`,
  )
}

export const BUILD = REACT_APP_BUILD
