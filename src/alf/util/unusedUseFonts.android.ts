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
    'Inter-Regular': require('../../../assets/fonts/inter/Inter-Regular.otf'),
    'Inter-Italic': require('../../../assets/fonts/inter/Inter-Italic.otf'),
    'Inter-Bold': require('../../../assets/fonts/inter/Inter-SemiBold.otf'),
    'Inter-BoldItalic': require('../../../assets/fonts/inter/Inter-SemiBoldItalic.otf'),
    'Inter-Black': require('../../../assets/fonts/inter/Inter-ExtraBold.otf'),
    'Inter-BlackItalic': require('../../../assets/fonts/inter/Inter-ExtraBoldItalic.otf'),
  })
}
