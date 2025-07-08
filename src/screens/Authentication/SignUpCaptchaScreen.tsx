import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'SignUpCaptcha'>
export function SignUpCaptchaScreen({}: Props) {
  return <SignUpCaptchaScreenInner />
}

export function SignUpCaptchaScreenInner() {
  return (
    <Layout.Screen testID="SignUpCaptchaScreen">
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
