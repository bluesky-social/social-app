import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {Text} from '#/components/Typography'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'StarterPackLanding'>
export function StarterPackLandingScreen({}: Props) {
  return <StarterPackLandingScreenInner />
}

export function StarterPackLandingScreenInner() {
  return (
    <Layout.Screen testID="StarterPackLandingScreen">
      <Layout.Content>
        <Text>TODO</Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
