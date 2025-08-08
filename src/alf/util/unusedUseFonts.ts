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
    // Hanken Grotesk fonts
    'HankenGrotesk-Thin': require('../../../assets/fonts/hanken/HankenGrotesk-Thin.ttf'),
    'HankenGrotesk-ThinItalic': require('../../../assets/fonts/hanken/HankenGrotesk-ThinItalic.ttf'),
    'HankenGrotesk-ExtraLight': require('../../../assets/fonts/hanken/HankenGrotesk-ExtraLight.ttf'),
    'HankenGrotesk-ExtraLightItalic': require('../../../assets/fonts/hanken/HankenGrotesk-ExtraLightItalic.ttf'),
    'HankenGrotesk-Light': require('../../../assets/fonts/hanken/HankenGrotesk-Light.ttf'),
    'HankenGrotesk-LightItalic': require('../../../assets/fonts/hanken/HankenGrotesk-LightItalic.ttf'),
    'HankenGrotesk-Regular': require('../../../assets/fonts/hanken/HankenGrotesk-Regular.ttf'),
    'HankenGrotesk-Italic': require('../../../assets/fonts/hanken/HankenGrotesk-Italic.ttf'),
    'HankenGrotesk-Medium': require('../../../assets/fonts/hanken/HankenGrotesk-Medium.ttf'),
    'HankenGrotesk-MediumItalic': require('../../../assets/fonts/hanken/HankenGrotesk-MediumItalic.ttf'),
    'HankenGrotesk-SemiBold': require('../../../assets/fonts/hanken/HankenGrotesk-SemiBold.ttf'),
    'HankenGrotesk-SemiBoldItalic': require('../../../assets/fonts/hanken/HankenGrotesk-SemiBoldItalic.ttf'),
    'HankenGrotesk-Bold': require('../../../assets/fonts/hanken/HankenGrotesk-Bold.ttf'),
    'HankenGrotesk-BoldItalic': require('../../../assets/fonts/hanken/HankenGrotesk-BoldItalic.ttf'),
    'HankenGrotesk-ExtraBold': require('../../../assets/fonts/hanken/HankenGrotesk-ExtraBold.ttf'),
    'HankenGrotesk-ExtraBoldItalic': require('../../../assets/fonts/hanken/HankenGrotesk-ExtraBoldItalic.ttf'),
    'HankenGrotesk-Black': require('../../../assets/fonts/hanken/HankenGrotesk-Black.ttf'),
    'HankenGrotesk-BlackItalic': require('../../../assets/fonts/hanken/HankenGrotesk-BlackItalic.ttf'),
  })
}
