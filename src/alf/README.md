# Application Layout Framework (ALF)

```tsx
import { View } from 'react-native'
import { useAlf } from '#/alf'
import { H3 } from '#/view/com/Typography'

function App() {
  const { styles, breakpoints } = useAlf()

  return (
    <View style={[styles.flex.row, styles.padding.pa.xl]}>
      <H3 style={[styles.padding.pb.m, styles.color.primary]}>I'm the blue color</H3>
    </View>
  )
}
```

Is a little nicer than:

```tsx
import { View } from 'react-native'
import { useTheme, styles } from '#/alf'
import { H3 } from '#/view/com/Typography'

function App() {
  const theme = useTheme()

  return (
    <View style={[styles.flex.row, styles.padding.pa.xl]}>
      <H3 style={[styles.padding.pb.m, theme.color.primary]}>I'm the blue color</H3>
    </View>
  )
}
```
