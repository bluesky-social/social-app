import {useTheme} from '#/alf'

export function useBackgroundColor(value: string | undefined) {
  const t = useTheme()

  let background
  if (value === 'default') {
    background = t.atoms.bg
  } else if (value === 'primary') {
    background = {backgroundColor: t.palette.primary_500}
  } else if (value === 'secondary') {
    background = t.atoms.bg_contrast_100
  } else if (value === 'positive') {
    background = {backgroundColor: t.palette.positive_500}
  } else if (value === 'negative') {
    background = {backgroundColor: t.palette.negative_500}
  } else if (value === 'inverted') {
    background = t.atoms.bg_contrast_950
  }
  return background
}

export function useBorderColor(value: string | undefined) {
  const t = useTheme()

  let borderColor
  if (value === 'default') {
    borderColor = {
      borderWidth: 1,
      borderColor: t.atoms.border_contrast_medium.borderColor,
    }
  } else if (value === 'primary') {
    borderColor = {borderWidth: 1, borderColor: t.palette.primary_500}
  } else if (value === 'secondary') {
    borderColor = {
      borderWidth: 1,
      borderColor: t.atoms.border_contrast_low.borderColor,
    }
  } else if (value === 'positive') {
    borderColor = {borderWidth: 1, borderColor: t.palette.positive_500}
  } else if (value === 'negative') {
    borderColor = {borderWidth: 1, borderColor: t.palette.negative_500}
  }

  return borderColor
}

export function useFontColor(value: string | undefined) {
  const t = useTheme()

  let fontColor
  if (value === 'default') {
    fontColor = t.atoms.text
  } else if (value === 'primary') {
    fontColor = {color: t.palette.primary_500}
  } else if (value === 'secondary') {
    fontColor = t.atoms.text_contrast_medium
  } else if (value === 'positive') {
    fontColor = {color: t.palette.positive_500}
  } else if (value === 'negative') {
    fontColor = {color: t.palette.negative_500}
  } else if (value === 'inverted') {
    fontColor = {color: t.atoms.bg.backgroundColor}
  }
  return fontColor
}
