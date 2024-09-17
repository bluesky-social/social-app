import {useFonts as defaultUseFonts} from 'expo-font'

import {Device, device} from '#/storage'

export function getFontScale() {
  return device.get(['fontScale']) || 1
}

export function setFontScale(fontScale: Device['fontScale']) {
  device.set(['fontScale'], fontScale)
}

export function getFontFamily() {
  return device.get(['fontFamily']) || 'system'
}

export function setFontFamily(fontFamily: Device['fontFamily']) {
  device.set(['fontFamily'], fontFamily)
}

export function useFonts() {
  return defaultUseFonts({
    'Inter-Thin': require('../../assets/fonts/inter/Inter-Thin.otf'),
    'Inter-ThinItalic': require('../../assets/fonts/inter/Inter-ThinItalic.otf'),
    'Inter-ExtraLight': require('../../assets/fonts/inter/Inter-ExtraLight.otf'),
    'Inter-ExtraLightItalic': require('../../assets/fonts/inter/Inter-ExtraLightItalic.otf'),
    'Inter-Light': require('../../assets/fonts/inter/Inter-Light.otf'),
    'Inter-LightItalic': require('../../assets/fonts/inter/Inter-LightItalic.otf'),
    'Inter-Regular': require('../../assets/fonts/inter/Inter-Regular.otf'),
    'Inter-Italic': require('../../assets/fonts/inter/Inter-Italic.otf'),
    'Inter-Medium': require('../../assets/fonts/inter/Inter-Medium.otf'),
    'Inter-MediumItalic': require('../../assets/fonts/inter/Inter-MediumItalic.otf'),
    'Inter-SemiBold': require('../../assets/fonts/inter/Inter-SemiBold.otf'),
    'Inter-SemiBoldItalic': require('../../assets/fonts/inter/Inter-SemiBoldItalic.otf'),
    'Inter-Bold': require('../../assets/fonts/inter/Inter-Bold.otf'),
    'Inter-BoldItalic': require('../../assets/fonts/inter/Inter-BoldItalic.otf'),
    'Inter-ExtraBold': require('../../assets/fonts/inter/Inter-ExtraBold.otf'),
    'Inter-ExtraBoldItalic': require('../../assets/fonts/inter/Inter-ExtraBoldItalic.otf'),
    'Inter-Black': require('../../assets/fonts/inter/Inter-Black.otf'),
    'Inter-BlackItalic': require('../../assets/fonts/inter/Inter-BlackItalic.otf'),
  })
}

export function applyFonts(style: Record<string, any>) {
  style.fontFamily =
    {
      '100': 'Inter-Thin',
      '200': 'Inter-ExtraLight',
      '300': 'Inter-Light',
      '400': 'Inter-Regular',
      '500': 'Inter-Medium',
      '600': 'Inter-SemiBold',
      '700': 'Inter-Bold',
      '800': 'Inter-ExtraBold',
      '900': 'Inter-Black',
    }[style.fontWeight as string] || 'Inter-Regular'

  if (style.fontStyle === 'italic') {
    if (style.fontFamily === 'Inter-Regular') {
      style.fontFamily = 'Inter-Italic'
    } else {
      style.fontFamily += 'Italic'
    }
  }
}
