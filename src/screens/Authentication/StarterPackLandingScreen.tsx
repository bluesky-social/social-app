import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'StarterPackLanding'>
export function StarterPackLandingScreen({}: Props) {
  return (
    <Layout.Screen testID="StarterPackLandingScreen">
      <Layout.Content>
        <Text>TODO</Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
