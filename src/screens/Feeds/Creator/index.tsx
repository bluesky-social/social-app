import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserSelectButton} from '#/screens/Feeds/Creator/UserSelectButton'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon,ButtonText} from '#/components/Button'
import {OutlineTags} from '#/components/Composer/OutlineTags'
import * as TextField from '#/components/forms/TextField'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function Creator() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 300,
  })

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [_tags, setTags] = React.useState<string[]>([])
  const [dids, setDids] = React.useState<string[]>([])

  return (
    <Layout.Screen>
      <Layout.ScrollView>
        <Layout.Center>
          <Layout.Header>
            <Layout.Header.TitleText>Create a feed</Layout.Header.TitleText>
          </Layout.Header>

          <Layout.Gutter top style={[a.gap_2xl]}>
            <View style={[a.gap_lg]}>
              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Create a feed for you, your friends, or your organization. You
                  can decide what type of content is included using the options
                  below.
                </Trans>
              </Text>

              <View>
                <TextField.LabelText>
                  <Trans>Title</Trans>
                </TextField.LabelText>

                <TextField.Root>
                  <TextField.Input
                    label={_(
                      msg`${
                        currentProfile?.displayName || currentProfile?.handle
                      }'s feed`,
                    )}
                    value={name}
                    onChangeText={setName}
                  />
                  <TextField.SuffixText label={_(`${name?.length} out of 50`)}>
                    <Text style={[t.atoms.text_contrast_medium]}>
                      {name?.length ?? 0}/50
                    </Text>
                  </TextField.SuffixText>
                </TextField.Root>
              </View>
              <View>
                <TextField.LabelText>
                  <Trans>Description</Trans>
                </TextField.LabelText>
                <TextField.Root>
                  <TextField.Input
                    label={_(
                      msg`${
                        currentProfile?.displayName || currentProfile?.handle
                      }'s favorite posts`,
                    )}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    style={{minHeight: 100}}
                  />
                </TextField.Root>
              </View>

              <Admonition type="tip">
                Choosing a descriptive title and description will help others
                find your feed!
              </Admonition>
            </View>

            <View style={[a.gap_md]}>
              <Text style={[a.text_xl, a.font_heavy, a.leading_tight]}>
                <Trans>Users</Trans>
              </Text>

              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Only posts by users you add here will appear in your feed.
                </Trans>
              </Text>

              <UserSelectButton dids={dids} onChangeDids={setDids} />
            </View>

            <View style={[a.gap_md]}>
              <Text style={[a.text_xl, a.font_heavy, a.leading_tight]}>
                <Trans>Tags</Trans>
              </Text>

              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Posts tagged with the following tags will automatically appear
                  in your feed, provided they are from the users you've selected
                  above.
                </Trans>
              </Text>

              <View
                style={[
                  a.py_sm,
                  a.px_sm,
                  a.border,
                  a.rounded_sm,
                  t.atoms.border_contrast_low,
                ]}>
                <OutlineTags onChangeTags={setTags} />
              </View>

              <Admonition type="tip">
                Tags added here also help users find your feed!
              </Admonition>
            </View>

            <Button
              label={_(msg`Save feed`)}
              size="large"
              variant="solid"
              color="primary">
              <ButtonText>
                <Trans>Create feed</Trans>
              </ButtonText>
              <ButtonIcon icon={Plus} position="right" />
            </Button>

            <View style={{height: 500}} />
          </Layout.Gutter>
        </Layout.Center>
      </Layout.ScrollView>
    </Layout.Screen>
  )
}
