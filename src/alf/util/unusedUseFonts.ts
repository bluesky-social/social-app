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
    InterVariable: require('../../../assets/fonts/inter/InterVariable.woff2'),
    'InterVariable-Italic': require('../../../assets/fonts/inter/InterVariable-Italic.woff2'),
    RubikVariable: require('../../../assets/fonts/rubik/Rubik-VariableFont_wght.ttf'),
    'RubikVariable-Italic': require('../../../assets/fonts/rubik/Rubik-Italic-VariableFont_wght.ttf'),
    AzeretMonoVariable: require('../../../assets/fonts/azeret_mono/AzeretMono-VariableFont_wght.ttf'),
    'AzeretMonoVariable-Italic': require('../../../assets/fonts/azeret_mono/AzeretMono-Italic-VariableFont_wght.ttf'),
  })
}
