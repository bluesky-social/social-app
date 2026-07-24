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
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {getAllListMembers} from '#/state/queries/list-members'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, platform, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
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

  const record = starterPack.record as AppBskyGraphStarterpack.Record

  const onPressCreate = () => {
    control.close(() => createDialogControl.open())
  }

  const addMembersToList = async (listUri: string) => {
    if (!starterPack.list || !currentAccount) return

    try {
      const items = await getAllListMembers(agent, starterPack.list.uri)

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

      queryClient.invalidateQueries({queryKey: ['list-members', listUri]})

      ax.metric('starterPack:convertToList', {
        starterPack: starterPack.uri,
        memberCount: items.length,
      })
    } catch (e) {
      logger.error('Failed to add members to list', {safeMessage: e})
      Toast.show(_(msg`List created, but failed to add some members`), {
        type: 'error',
      })
    }
  }

  const onListCreated = (listUri: string) => {
    const urip = new AtUri(listUri)
    navigation.navigate('ProfileList', {
      name: urip.hostname,
      rkey: urip.rkey,
    })
    addMembersToList(listUri)
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
              <Trans>
                Changes to the starter pack will not be reflected in the list
                after creation. The list will be an independent copy.
              </Trans>
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
    </>
  )
}
