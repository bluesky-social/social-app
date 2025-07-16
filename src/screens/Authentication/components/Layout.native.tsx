import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

export * from '#/components/Layout'

export function TitleText({children}: {children: React.ReactNode}) {
  return <Text style={[a.font_heavy, a.text_3xl]}>{children}</Text>
}
