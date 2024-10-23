import React from 'react'
import {View} from 'react-native'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {compressIfNeeded} from '#/lib/media/manip'
import {NavigationProp} from '#/lib/routes/types'
import {useCreateFeedMutation} from '#/state/queries/feed'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {EditableUserAvatar} from '#/view/com/util/UserAvatar'
import {UserSelectButton} from '#/screens/Feeds/Creator/UserSelectButton'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {OutlineTags} from '#/components/Composer/OutlineTags'
import * as TextField from '#/components/forms/TextField'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Creator() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 300,
  })
  const onSuccessCreate = (data: {uri: string; cid: string}) => {
    const rkey = new AtUri(data.uri).rkey
    navigation.replace('ProfileFeed', {
      name: currentAccount!.handle,
      rkey,
    })
  }
  const {mutateAsync: createFeed, isPending} = useCreateFeedMutation({
    onSuccess: onSuccessCreate,
    onError: e => {
      console.error(e)
    },
  })

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [tags, setTags] = React.useState<string[]>([])
  const [actors, setActors] = React.useState<string[]>([])
  const [avatar, setAvatar] = React.useState<string | undefined>()
  const [avatarImage, setAvatarImage] = React.useState<
    RNImage | undefined | null
  >()

  const onSubmit = React.useCallback(async () => {
    try {
      await createFeed({
        avatar: avatarImage ?? undefined,
        name,
        description,
        actors,
        tags,
        handleSuffixes: [],
      })
    } catch (e) {
      console.error(e)
    }
  }, [name, description, actors, tags, createFeed, avatarImage])

  const onSelectAvatar = React.useCallback(
    async (image: RNImage | null) => {
      //setImageError('')
      if (image === null) {
        setAvatar(undefined)
        setAvatarImage(null)
        return
      }
      try {
        const finalImg = await compressIfNeeded(image, 1000000)
        setAvatar(finalImg.path)
        setAvatarImage(finalImg)
      } catch (e: any) {
        //setImageError(cleanError(e))
      }
    },
    [setAvatar, setAvatarImage],
  )

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

              <View style={[a.flex_row, a.align_center, a.gap_md]}>
                <View>
                  <EditableUserAvatar
                    type="algo"
                    size={60}
                    avatar={avatar}
                    onSelectNewAvatar={onSelectAvatar}
                  />
                </View>
                <View>
                  <TextField.LabelText>
                    <Trans>Add an avatar</Trans>
                  </TextField.LabelText>
                  <Text>
                    <Trans>Be creative!</Trans>
                  </Text>
                </View>
              </View>

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
                <Trans>Automatically pull posts into your feed</Trans>
              </Text>

              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  You may add people below to automatically pull their posts
                  into your feed.
                </Trans>
              </Text>

              <UserSelectButton dids={actors} onChangeDids={setActors} />

              <Text
                style={[
                  a.text_md,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Choose which of their posts will get pulled into your feed by
                  adding tags.
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
              color="primary"
              onPress={onSubmit}
              disabled={isPending || (actors.length > 0 && tags.length === 0)}>
              <ButtonText>
                <Trans>Create feed</Trans>
              </ButtonText>
              <ButtonIcon icon={isPending ? Loader : Plus} position="right" />
            </Button>

            <View style={{height: 500}} />
          </Layout.Gutter>
        </Layout.Center>
      </Layout.ScrollView>
    </Layout.Screen>
  )
}
