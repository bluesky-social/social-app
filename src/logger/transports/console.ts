import format from 'date-fns/format'

import {LogLevel, type Transport} from '#/logger/types'
import {prepareMetadata} from '#/logger/util'
import {IS_WEB} from '#/env'

/**
 * Used in dev mode to nicely log to the console
 */
export const consoleTransport: Transport = (
  level,
  context,
  message,
  metadata,
  timestamp,
) => {
  const hasMetadata = Object.keys(metadata).length

  if (IS_WEB) {
    const cssColor = {
      [LogLevel.Debug]: 'magenta',
      [LogLevel.Info]: 'dodgerblue',
      [LogLevel.Log]: 'green',
      [LogLevel.Warn]: 'orange',
      [LogLevel.Error]: 'red',
    }[level]

    const timestampStr = format(timestamp, 'HH:mm:ss')
    const contextStr = context ? ` (${context})` : ''
    const messageStr = message ? ` ${message.toString()}` : ''

    const styledPart = `%c${timestampStr}${contextStr}%c${messageStr}`
    const styles = [`color: ${cssColor}; font-weight: bold`, 'color: inherit']

    if (hasMetadata) {
      console.groupCollapsed(styledPart, ...styles)
      console.log(prepareMetadata(metadata))
      console.groupEnd()
    } else {
      console.log(styledPart, ...styles)
    }
    if (message instanceof Error) {
      // for stacktrace
      console.error(message)
    }
  } else {
    const colorize = withColor(
      {
        [LogLevel.Debug]: colors.magenta,
        [LogLevel.Info]: colors.blue,
        [LogLevel.Log]: colors.green,
        [LogLevel.Warn]: colors.yellow,
        [LogLevel.Error]: colors.red,
      }[level],
    )

    let msg = `${colorize(format(timestamp, 'HH:mm:ss'))}`
    if (context) {
      msg += ` ${colorize(`(${context})`)}`
    }
    if (message) {
      msg += ` ${message.toString()}`
    }
    if (hasMetadata) {
      msg += ` ${JSON.stringify(prepareMetadata(metadata), null, 2)}`
    }
    console.log(msg)
    if (message instanceof Error) {
      // for stacktrace
      console.error(message)
    }
  }
}

/**
 * Color handling copied from Kleur
 *
 * @see https://github.com/lukeed/kleur/blob/fa3454483899ddab550d08c18c028e6db1aab0e5/colors.mjs#L13
 */
const colors: {
  [key: string]: [number, number]
} = {
  default: [0, 0],
  blue: [36, 39],
  green: [32, 39],
  magenta: [35, 39],
  red: [31, 39],
  yellow: [33, 39],
}

function withColor([x, y]: [number, number]) {
  const rgx = new RegExp(`\\x1b\\[${y}m`, 'g')
  const open = `\x1b[${x}m`,
    close = `\x1b[${y}m`

  return function (txt: string) {
    if (txt == null) return txt

    return (
      open +
      (~('' + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) +
      close
    )
  }
}
