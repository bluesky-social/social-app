import * as tokens from '#/alf/tokens'
import {styles as sharedStyles} from '#/alf/styles'

export type ThemeName = 'light' | 'dark'
export type Theme = typeof light

export type Palette = {
  primary: string
  positive: string
  negative: string
  l0: string
  l1: string
  l2: string
  l3: string
  l4: string
  l5: string
  l6: string
  l7: string
}

export const lightPalette: Palette = {
  primary: tokens.color.blue,
  positive: tokens.color.green,
  negative: tokens.color.red,
  l0: tokens.color.white,
  l1: tokens.color.gray1,
  l2: tokens.color.gray2,
  l3: tokens.color.gray3,
  l4: tokens.color.gray4,
  l5: tokens.color.gray5,
  l6: tokens.color.gray6,
  l7: tokens.color.black,
} as const

export const darkPalette: Palette = {
  primary: tokens.color.blue,
  positive: tokens.color.green,
  negative: tokens.color.red,
  l0: tokens.color.black,
  l1: tokens.color.gray6,
  l2: tokens.color.gray5,
  l3: tokens.color.gray4,
  l4: tokens.color.gray3,
  l5: tokens.color.gray2,
  l6: tokens.color.gray1,
  l7: tokens.color.white,
} as const

export const light = {
  ...sharedStyles,
  color: Object.keys(lightPalette).reduce((acc, key) => {
    const k = key as keyof Palette
    acc[k] = {
      color: lightPalette[k],
    }
    return acc
  }, {} as Record<keyof Palette, {color: string}>),
  backgroundColor: Object.keys(lightPalette).reduce((acc, key) => {
    const k = key as keyof Palette
    acc[k] = {
      backgroundColor: lightPalette[k],
    }
    return acc
  }, {} as Record<keyof Palette, {backgroundColor: string}>),
} as const

export const dark = {
  ...sharedStyles,
  color: Object.keys(darkPalette).reduce((acc, key) => {
    const k = key as keyof Palette
    acc[k] = {
      color: darkPalette[k],
    }
    return acc
  }, {} as Record<keyof Palette, {color: string}>),
  backgroundColor: Object.keys(darkPalette).reduce((acc, key) => {
    const k = key as keyof Palette
    acc[k] = {
      backgroundColor: darkPalette[k],
    }
    return acc
  }, {} as Record<keyof Palette, {backgroundColor: string}>),
} as const
