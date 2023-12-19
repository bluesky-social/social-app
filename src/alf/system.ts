/**
 * Library imports
 */
import {createSystem} from './lib/system'
import {light, dark} from './themes'

const {
  ThemeProvider,
  useTheme,
  useTokens,
  useBreakpoints,
  useStyle,
  useStyles,
  styled,
} = createSystem({
  light,
  dark,
})

export {
  ThemeProvider,
  useTheme,
  useTokens,
  useBreakpoints,
  useStyle,
  useStyles,
  styled,
}
