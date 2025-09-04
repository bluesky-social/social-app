import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Logo} from '#/view/icons/Logo'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'PasswordUpdated'>
export function PasswordUpdatedScreen({}: Props) {
  return <PasswordUpdatedScreenInner />
}

export function PasswordUpdatedScreenInner() {
  return (
    <Layout.Screen testID="PasswordUpdatedScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Logo />
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content contentContainerStyle={[a.px_2xl, a.py_lg]}>
        <Text>TODO</Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
