import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {useGutters} from '#/alf'
import {PostInteractionSettingsForm} from '#/components/dialogs/PostInteractionSettingsDialog'
import * as Layout from '#/components/Layout'

export function Screen() {
  const gutters = useGutters(['base'])
  return (
    <Layout.Screen testID="moderationInteractionSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Post Interaction Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={gutters}>
          <PostInteractionSettingsForm
            isSaving={false}
            onSave={() => {}}
            postgate={{
              $type: 'app.bsky.feed.postgate',
              createdAt: new Date().toString(),
              post: '',
            }}
            onChangePostgate={() => {}}
            threadgateAllowUISettings={[]}
            onChangeThreadgateAllowUISettings={() => {}}
          />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
