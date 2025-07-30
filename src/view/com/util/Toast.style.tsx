import {select, type Theme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as SuccessIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export const TOAST_ANIMATION_CONFIG = {
  duration: 300,
  damping: 15,
  stiffness: 150,
  mass: 0.8,
  overshootClamping: false,
  restSpeedThreshold: 0.01,
  restDisplacementThreshold: 0.01,
}

export const TOAST_TYPE_TO_ICON = {
  default: SuccessIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: CircleInfo,
}

export const getToastTypeStyles = (t: Theme) => ({
  default: {
    backgroundColor: select(t.name, {
      light: t.atoms.bg_contrast_25.backgroundColor,
      dim: t.atoms.bg_contrast_100.backgroundColor,
      dark: t.atoms.bg_contrast_100.backgroundColor,
    }),
    borderColor: select(t.name, {
      light: t.atoms.border_contrast_low.borderColor,
      dim: t.atoms.border_contrast_high.borderColor,
      dark: t.atoms.border_contrast_high.borderColor,
    }),
    iconColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
    textColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
  },
  success: {
    backgroundColor: select(t.name, {
      light: t.palette.primary_100,
      dim: t.palette.primary_100,
      dark: t.palette.primary_50,
    }),
    borderColor: select(t.name, {
      light: t.palette.primary_500,
      dim: t.palette.primary_500,
      dark: t.palette.primary_500,
    }),
    iconColor: select(t.name, {
      light: t.palette.primary_500,
      dim: t.palette.primary_600,
      dark: t.palette.primary_600,
    }),
    textColor: select(t.name, {
      light: t.palette.primary_500,
      dim: t.palette.primary_600,
      dark: t.palette.primary_600,
    }),
  },
  error: {
    backgroundColor: select(t.name, {
      light: t.palette.negative_200,
      dim: t.palette.negative_25,
      dark: t.palette.negative_25,
    }),
    borderColor: select(t.name, {
      light: t.palette.negative_300,
      dim: t.palette.negative_300,
      dark: t.palette.negative_300,
    }),
    iconColor: select(t.name, {
      light: t.palette.negative_600,
      dim: t.palette.negative_600,
      dark: t.palette.negative_600,
    }),
    textColor: select(t.name, {
      light: t.palette.negative_600,
      dim: t.palette.negative_600,
      dark: t.palette.negative_600,
    }),
  },
  warning: {
    backgroundColor: select(t.name, {
      light: t.atoms.bg_contrast_25.backgroundColor,
      dim: t.atoms.bg_contrast_100.backgroundColor,
      dark: t.atoms.bg_contrast_100.backgroundColor,
    }),
    borderColor: select(t.name, {
      light: t.atoms.border_contrast_low.borderColor,
      dim: t.atoms.border_contrast_high.borderColor,
      dark: t.atoms.border_contrast_high.borderColor,
    }),
    iconColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
    textColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
  },
  info: {
    backgroundColor: select(t.name, {
      light: t.atoms.bg_contrast_25.backgroundColor,
      dim: t.atoms.bg_contrast_100.backgroundColor,
      dark: t.atoms.bg_contrast_100.backgroundColor,
    }),
    borderColor: select(t.name, {
      light: t.atoms.border_contrast_low.borderColor,
      dim: t.atoms.border_contrast_high.borderColor,
      dark: t.atoms.border_contrast_high.borderColor,
    }),
    iconColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
    textColor: select(t.name, {
      light: t.atoms.text_contrast_medium.color,
      dim: t.atoms.text_contrast_medium.color,
      dark: t.atoms.text_contrast_medium.color,
    }),
  },
})

export const getToastWebAnimationStyles = () => ({
  entering: {
    animation: 'toastFadeIn 0.3s ease-out forwards',
  },
  exiting: {
    animation: 'toastFadeOut 0.2s ease-in forwards',
  },
})

export const TOAST_WEB_KEYFRAMES = `
  @keyframes toastFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes toastFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`
