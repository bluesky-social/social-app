import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'SignUpInfo'>
export function SignUpInfoScreen({}: Props) {
  return <SignUpInfoScreenInner />
}

export function SignUpInfoScreenInner() {
  return (
    <Layout.Screen testID="SignUpInfoScreen">
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
