import {platform} from '#/alf'

export const PROP_1 = {
  light: platform({
    native: require('../../../../assets/images/onboarding/value_prop_1_light.webp'),
    web: require('../../../../assets/images/onboarding/value_prop_1_light_borderless.webp'),
  }),
  dim: platform({
    native: require('../../../../assets/images/onboarding/value_prop_1_dim.webp'),
    web: require('../../../../assets/images/onboarding/value_prop_1_dim_borderless.webp'),
  }),
  dark: platform({
    native: require('../../../../assets/images/onboarding/value_prop_1_dark.webp'),
    web: require('../../../../assets/images/onboarding/value_prop_1_dark_borderless.webp'),
  }),
} as const

export const PROP_2 = {
  light: require('../../../../assets/images/onboarding/value_prop_2_light.webp'),
  dim: require('../../../../assets/images/onboarding/value_prop_2_dim.webp'),
  dark: require('../../../../assets/images/onboarding/value_prop_2_dark.webp'),
} as const

export const PROP_3 = {
  light: require('../../../../assets/images/onboarding/value_prop_3_light.webp'),
  dim: require('../../../../assets/images/onboarding/value_prop_3_dim.webp'),
  dark: require('../../../../assets/images/onboarding/value_prop_3_dark.webp'),
} as const
