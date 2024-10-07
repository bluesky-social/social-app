import {StyleProp, TextStyle, ViewStyle} from 'react-native'

export type TextStyleProp = {
  style?: StyleProp<TextStyle>
}

export type ViewStyleProp = {
  style?: StyleProp<ViewStyle>
}

export type ThemeName = 'light' | 'dim' | 'dark'
export type Palette = {
  white: string
  black: string

  contrast_25: string
  contrast_50: string
  contrast_100: string
  contrast_200: string
  contrast_300: string
  contrast_400: string
  contrast_500: string
  contrast_600: string
  contrast_700: string
  contrast_800: string
  contrast_900: string
  contrast_950: string
  contrast_975: string

  primary_25: string
  primary_50: string
  primary_100: string
  primary_200: string
  primary_300: string
  primary_400: string
  primary_500: string
  primary_600: string
  primary_700: string
  primary_800: string
  primary_900: string
  primary_950: string
  primary_975: string

  positive_25: string
  positive_50: string
  positive_100: string
  positive_200: string
  positive_300: string
  positive_400: string
  positive_500: string
  positive_600: string
  positive_700: string
  positive_800: string
  positive_900: string
  positive_950: string
  positive_975: string

  negative_25: string
  negative_50: string
  negative_100: string
  negative_200: string
  negative_300: string
  negative_400: string
  negative_500: string
  negative_600: string
  negative_700: string
  negative_800: string
  negative_900: string
  negative_950: string
  negative_975: string
}
export type ThemedAtoms = {
  text: {
    color: string
  }
  text_contrast_low: {
    color: string
  }
  text_contrast_medium: {
    color: string
  }
  text_contrast_high: {
    color: string
  }
  text_inverted: {
    color: string
  }
  bg: {
    backgroundColor: string
  }
  bg_contrast_25: {
    backgroundColor: string
  }
  bg_contrast_50: {
    backgroundColor: string
  }
  bg_contrast_100: {
    backgroundColor: string
  }
  bg_contrast_200: {
    backgroundColor: string
  }
  bg_contrast_300: {
    backgroundColor: string
  }
  bg_contrast_400: {
    backgroundColor: string
  }
  bg_contrast_500: {
    backgroundColor: string
  }
  bg_contrast_600: {
    backgroundColor: string
  }
  bg_contrast_700: {
    backgroundColor: string
  }
  bg_contrast_800: {
    backgroundColor: string
  }
  bg_contrast_900: {
    backgroundColor: string
  }
  bg_contrast_950: {
    backgroundColor: string
  }
  bg_contrast_975: {
    backgroundColor: string
  }
  border_contrast_low: {
    borderColor: string
  }
  border_contrast_medium: {
    borderColor: string
  }
  border_contrast_high: {
    borderColor: string
  }
  shadow_sm: {
    shadowRadius: number
    shadowOpacity: number
    elevation: number
    shadowColor: string
  }
  shadow_md: {
    shadowRadius: number
    shadowOpacity: number
    elevation: number
    shadowColor: string
  }
  shadow_lg: {
    shadowRadius: number
    shadowOpacity: number
    elevation: number
    shadowColor: string
  }
}
export type Theme = {
  scheme: 'light' | 'dark' // for library support
  name: ThemeName
  palette: Palette
  atoms: ThemedAtoms
}
