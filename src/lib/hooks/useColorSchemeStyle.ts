import {useColorScheme} from 'react-native'

export function useColorSchemeStyle(lightStyle: any, darkStyle: any) {
  const colorScheme = useColorScheme()
  return colorScheme === 'dark' ? darkStyle : lightStyle
}
