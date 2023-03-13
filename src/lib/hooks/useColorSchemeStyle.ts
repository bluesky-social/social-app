import {useTheme} from 'lib/ThemeContext'

export function useColorSchemeStyle(lightStyle: any, darkStyle: any) {
  const colorScheme = useTheme().colorScheme
  return colorScheme === 'dark' ? darkStyle : lightStyle
}
