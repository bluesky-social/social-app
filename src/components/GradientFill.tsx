import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, tokens} from '#/alf'

export function GradientFill({
  gradient,
  rotate,
}: {
  gradient:
    | typeof tokens.gradients.primary
    | typeof tokens.gradients.sky
    | typeof tokens.gradients.midnight
    | typeof tokens.gradients.sunrise
    | typeof tokens.gradients.sunset
    | typeof tokens.gradients.bonfire
    | typeof tokens.gradients.summer
    | typeof tokens.gradients.nordic
  rotate?: '90deg' | '180deg' | '270deg'
}) {
  const {start, end} = React.useMemo(() => {
    switch (rotate) {
      case '90deg': {
        return {start: {x: 1, y: 0}, end: {x: 1, y: 1}}
      }
      case '180deg': {
        return {start: {x: 1, y: 1}, end: {x: 0, y: 0}}
      }
      case '270deg': {
        return {start: {x: 0, y: 1}, end: {x: 0, y: 0}}
      }
      default: {
        return {start: {x: 0, y: 0}, end: {x: 1, y: 1}}
      }
    }
  }, [rotate])
  return (
    <LinearGradient
      colors={gradient.values.map(c => c[1])}
      locations={gradient.values.map(c => c[0])}
      start={start}
      end={end}
      style={[a.absolute, a.inset_0]}
    />
  )
}
