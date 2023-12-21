# Application Layout Framework (ALF)

```tsx
import {View} from 'react-native'
import {atoms, useTheme, useBreakpoints, web} from '#/alf'
import {H3, Text} from '#/view/com/Typography'

function App() {
  const theme = useTheme()
  const breakpoints = useBreakpoints()

  return (
    <View style={[atoms.flex.row, atoms.padding.pa.xl, web({height: '100vh'})]}>
      <H3 style={[atoms.padding.pb.m, theme.atoms.color.primary]}>
        I'm the blue color
      </H3>

      {breakpoints.gtMobile && (
        <Text style={[theme.atoms.backgroundColor.l1]}>Only visible on tablet and above!</Text>
      )}
    </View>
  )
}
```
