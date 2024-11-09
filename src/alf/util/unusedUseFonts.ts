import {useFonts} from 'expo-font'

/*
 * IMPORTANT: This is unused. Expo statically extracts these fonts.
 *
 * All used fonts MUST be configured here. Unused fonts can be commented out.
 *
 * This is used for both web fonts and native fonts.
 */
export function DO_NOT_USE() {
  return useFonts({
    InterVariable: require('../../../assets/fonts/inter/InterVariable.ttf'),
    'InterVariable-Italic': require('../../../assets/fonts/inter/InterVariable-Italic.ttf'),
  })
}
