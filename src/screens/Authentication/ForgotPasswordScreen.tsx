import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'ForgotPassword'>
export function ForgotPasswordScreen({}: Props) {
  return (
    <Layout.Screen testID="ForgotPasswordScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <Text>TODO</Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
