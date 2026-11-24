import {Breakpoints} from '#/view/screens/Storybook/Breakpoints'
import {Icons} from '#/view/screens/Storybook/Icons'
import {Shadows} from '#/view/screens/Storybook/Shadows'
import {Spacing} from '#/view/screens/Storybook/Spacing'
import {Theming} from '#/view/screens/Storybook/Theming'
import {Typography} from '#/view/screens/Storybook/Typography'
import {ThemeProvider} from '#/alf'

export default function FoundationsPage() {
  return (
    <>
      <ThemeProvider theme="light">
        <Theming />
      </ThemeProvider>
      <ThemeProvider theme="dim">
        <Theming />
      </ThemeProvider>
      <ThemeProvider theme="dark">
        <Theming />
      </ThemeProvider>
      <Typography />
      <Spacing />
      <Shadows />
      <Icons />
      <Breakpoints />
    </>
  )
}
