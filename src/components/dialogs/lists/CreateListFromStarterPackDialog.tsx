import {View} from 'react-native'
import {
  type $Typed,
  type AppBskyGraphDefs,
  type AppBskyGraphListitem,
  type AppBskyGraphStarterpack,
  AtUri,
  type ComAtprotoRepoApplyWrites,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'
import {wait} from '#/lib/async/wait'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {getAllListMembers} from '#/state/queries/list-members'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, platform, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {CreateOrEditListDialog} from './CreateOrEditListDialog'

export function CreateListFromStarterPackDialog({
  control,
  starterPack,
}: {
  control: Dialog.DialogControlProps
  starterPack: AppBskyGraphDefs.StarterPackView
}) {
  const {_} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const queryClient = useQueryClient()
  const createDialogControl = Dialog.useDialogControl()
  const loadingDialogControl = Dialog.useDialogControl()

  const record = starterPack.record as AppBskyGraphStarterpack.Record

  const onPressCreate = () => {
    control.close(() => createDialogControl.open())
  }

  const addMembersAndNavigate = async (listUri: string) => {
    const navigateToList = () => {
      const urip = new AtUri(listUri)
      navigation.navigate('ProfileList', {
        name: urip.hostname,
        rkey: urip.rkey,
      })
    }

    if (!starterPack.list || !currentAccount) {
      loadingDialogControl.close(navigateToList)
      return
    }

    try {
      // Fetch all members and add them, with minimum 3s duration for UX
      const listItems = await wait(
        3000,
        (async () => {
          const items = await getAllListMembers(agent, starterPack.list!.uri)

          if (items.length > 0) {
            const listitemWrites: $Typed<ComAtprotoRepoApplyWrites.Create>[] =
              items.map(item => {
                const listitemRecord: $Typed<AppBskyGraphListitem.Record> = {
                  $type: 'app.bsky.graph.listitem',
                  subject: item.subject.did,
                  list: listUri,
                  createdAt: new Date().toISOString(),
                }
                return {
                  $type: 'com.atproto.repo.applyWrites#create',
                  collection: 'app.bsky.graph.listitem',
                  rkey: TID.nextStr(),
                  value: listitemRecord,
                }
              })

            const chunks = chunk(listitemWrites, 50)
            for (const c of chunks) {
              await agent.com.atproto.repo.applyWrites({
                repo: currentAccount.did,
                writes: c,
              })
            }

            await until(
              5,
              1e3,
              (res: {data: {items: unknown[]}}) => res.data.items.length > 0,
              () =>
                agent.app.bsky.graph.getList({
                  list: listUri,
                  limit: 1,
                }),
            )
          }

          return items
        })(),
      )

      queryClient.invalidateQueries({queryKey: ['list-members', listUri]})

      ax.metric('starterPack:convertToList', {
        starterPack: starterPack.uri,
        memberCount: listItems.length,
      })
    } catch (e) {
      logger.error('Failed to add members to list', {safeMessage: e})
      Toast.show(_(msg`List created, but failed to add some members`), {
        type: 'error',
      })
    }

    loadingDialogControl.close(navigateToList)
  }

  const onListCreated = (listUri: string) => {
    loadingDialogControl.open()
    addMembersAndNavigate(listUri)
  }

  return (
    <>
      <Dialog.Outer
        control={control}
        testID="createListFromStarterPackDialog"
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Create list from starter pack`)}
          style={web({maxWidth: 400})}>
          <View style={[a.gap_lg]}>
            <Text style={[a.text_xl, a.font_bold]}>
              <Trans>Create list from starter pack</Trans>
            </Text>

            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              <Trans>
                This will create a new list with the same name, description, and
                members as this starter pack.
              </Trans>
            </Text>

            <Admonition type="tip">
              Changes to the starter pack will not be reflected in the list
              after creation. The list will be an independent copy.
            </Admonition>

            <View
              style={[
                platform({
                  web: [a.flex_row_reverse],
                  native: [a.flex_col],
                }),
                a.gap_md,
                a.pt_sm,
              ]}>
              <Button
                label={_(msg`Create list`)}
                onPress={onPressCreate}
                size={platform({
                  web: 'small',
                  native: 'large',
                })}
                color="primary">
                <ButtonText>
                  <Trans>Create list</Trans>
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Cancel`)}
                onPress={() => control.close()}
                size={platform({
                  web: 'small',
                  native: 'large',
                })}
                color="secondary">
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <CreateOrEditListDialog
        control={createDialogControl}
        purpose="app.bsky.graph.defs#curatelist"
        onSave={onListCreated}
        initialValues={{
          name: record.name,
          description: record.description,
          avatar: starterPack.list?.avatar,
        }}
      />

      <Dialog.Outer
        control={loadingDialogControl}
        nativeOptions={{preventDismiss: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Adding members to list...`)}
          style={web({maxWidth: 400})}>
          <View style={[a.align_center, a.gap_lg, a.py_5xl]}>
            <Loader size="xl" />
            <Text style={[a.text_lg, t.atoms.text_contrast_high]}>
              <Trans>Adding members to list...</Trans>
            </Text>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
