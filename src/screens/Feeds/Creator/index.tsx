import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as TextField from '#/components/forms/TextField'
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

  return (
    <Layout.Screen>
      <Layout.ScrollView>
        <Layout.Center>
          <Layout.Header>
            <Layout.Header.TitleText>Create a feed</Layout.Header.TitleText>
          </Layout.Header>

          <Layout.Gutter top>
            <View style={[a.gap_lg]}>
              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  a.pb_sm,
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
                    style={{minHeight: 150}}
                  />
                </TextField.Root>
              </View>

              <Admonition type="tip">
                Choosing a descriptive title and description will help others
                find your feed!
              </Admonition>
            </View>
          </Layout.Gutter>
        </Layout.Center>
      </Layout.ScrollView>
    </Layout.Screen>
  )
}
