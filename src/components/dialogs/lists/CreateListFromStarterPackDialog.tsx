import {View} from 'react-native'
import {
  type $Typed,
  type AppBskyGraphDefs,
  type AppBskyGraphListitem,
  AppBskyGraphStarterpack,
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
import {type NavigationProp} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {getAllListMembers} from '#/state/queries/list-members'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
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
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const queryClient = useQueryClient()
  const createDialogControl = Dialog.useDialogControl()

  const record = starterPack.record as AppBskyGraphStarterpack.Record

  const onPressCreate = () => {
    control.close(() => createDialogControl.open())
  }

  const onListCreated = async (listUri: string) => {
    const navigateToList = () => {
      const urip = new AtUri(listUri)
      navigation.navigate('ProfileList', {
        name: urip.hostname,
        rkey: urip.rkey,
      })
    }

    // Dialog is already closed by CreateOrEditListDialog before onSave is called
    if (!starterPack.list || !currentAccount) {
      navigateToList()
      return
    }

    try {
      // Fetch all members from the starter pack's list
      const listItems = await getAllListMembers(agent, starterPack.list.uri)

      if (listItems.length > 0) {
        // Create list item records for all members
        const listitemWrites: $Typed<ComAtprotoRepoApplyWrites.Create>[] =
          listItems.map(item => {
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

        // Write in chunks of 50
        const chunks = chunk(listitemWrites, 50)
        for (const c of chunks) {
          await agent.com.atproto.repo.applyWrites({
            repo: currentAccount.did,
            writes: c,
          })
        }

        // Wait for the appview to be updated
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

      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['list-members', listUri]})

      logEvent('starterPack:convertToList', {
        starterPack: starterPack.uri,
        memberCount: listItems.length,
      })

      Toast.show(_(msg`List created with ${listItems.length} members`))
    } catch (e) {
      logger.error('Failed to add members to list', {safeMessage: e})
      Toast.show(
        _(msg`List created, but failed to add some members`),
        'xmark',
      )
    }

    navigateToList()
  }

  return (
    <>
      <Dialog.Outer control={control} testID="createListFromStarterPackDialog">
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`Create list from starter pack`)}>
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

            <View
              style={[
                a.p_md,
                a.rounded_sm,
                a.border,
                t.atoms.border_contrast_low,
                t.atoms.bg_contrast_25,
              ]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>
                  Changes to the starter pack will not be reflected in the list
                  after creation. The list will be an independent copy.
                </Trans>
              </Text>
            </View>

            <View style={[a.flex_row, a.gap_md, a.justify_end, a.pt_sm]}>
              <Button
                label={_(msg`Cancel`)}
                onPress={() => control.close()}
                size="medium"
                color="secondary"
                variant="solid">
                <ButtonText>
                  <Trans>Cancel</Trans>
                </ButtonText>
              </Button>
              <Button
                label={_(msg`Create list`)}
                onPress={onPressCreate}
                size="medium"
                color="primary"
                variant="solid">
                <ButtonText>
                  <Trans>Create list</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>
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
