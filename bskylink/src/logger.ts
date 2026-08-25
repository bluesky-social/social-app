import {subsystemLogger} from '@atproto/common'
import {type Logger} from 'pino'

export const httpLogger: Logger = subsystemLogger('bskylink')
export const dbLogger: Logger = subsystemLogger('bskylink:db')
export const redirectLogger: Logger = subsystemLogger('bskylink:redirect')

redirectLogger.info = (
  orig =>
  (...args: any[]) => {
    const [msg, ...rest] = args
    orig.apply(redirectLogger, [String(msg), ...rest])
    console.log('[bskylink:redirect]', ...args)
  }
)(redirectLogger.info) as typeof redirectLogger.info
