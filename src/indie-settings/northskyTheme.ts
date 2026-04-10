export const northskyDarkTheme = {
  palette: {
    primary_100: '#38175A', // Hover background
    primary_200: '#7780DC', // Disabled button background
    primary_300: '#59B2CF', // Hover language selector
    primary_500: '#9A45EC', // Primary button background, link texts
    primary_600: '#59B2CF', // Hover background
  },
  atoms: {
    bg: {
      backgroundColor: '#1F0B35',
    },
  },
}

export const northskyLightTheme = {
  palette: {
    primary_500: '#2AFBBA', // Primary button background, link texts
  },
  atoms: {
    bg: {
      backgroundColor: '#DFE1E3',
    },
  },
}

export const themes = {
  dark: northskyDarkTheme,
  dim: northskyDarkTheme,
  light: northskyLightTheme,
}
