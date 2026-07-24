import {useState} from 'react'
import {View} from 'react-native'
import {type ModerationCause} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {makeProfileLink} from '#/lib/routes/links'
import {listUriToHref} from '#/lib/strings/url-helpers'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useGutters, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {AppealForm} from '#/components/moderation/AppealForm'
import {type AppModerationCause} from '#/components/Pills'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export {useDialogControl as useModerationDetailsDialogControl} from '#/components/Dialog'

export interface ModerationDetailsDialogProps {
  control: Dialog.DialogOuterProps['control']
  modcause?: ModerationCause | AppModerationCause
}

export function ModerationDetailsDialog(props: ModerationDetailsDialogProps) {
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <ModerationDetailsDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ModerationDetailsDialogInner({
  modcause,
  control,
}: ModerationDetailsDialogProps & {
  control: Dialog.DialogOuterProps['control']
}) {
  const t = useTheme()
  const xGutters = useGutters([0, 'base'])
  const {t: l} = useLingui()
  const desc = useModerationCauseDescription(modcause)
  const {currentAccount} = useSession()
  const timeDiff = useGetTimeAgo({future: true})
  const [isAppealing, setIsAppealing] = useState(false)
  const {gtPhone} = useBreakpoints()

  /*
   * Appeal eligibility: only for label causes on content belonging to the
   * current user, where the label was not self-applied.
   */
  const canAppeal =
    modcause?.type === 'label' &&
    !!currentAccount &&
    modcause.label.src !== currentAccount.did &&
    (modcause.label.uri === currentAccount.did ||
      modcause.label.uri.startsWith(`at://${currentAccount.did}/`))

  let name
  let description
  if (!modcause) {
    name = l`Content Warning`
    description = l`Moderator has chosen to set a general warning on the content.`
  } else if (modcause.type === 'blocking') {
    if (modcause.source.type === 'list') {
      const list = modcause.source.list
      name = l`User Blocked by List`
      description = (
        <Trans>
          This user is included in the{' '}
          <InlineLinkText
            label={list.name}
            to={listUriToHref(list.uri)}
            style={[a.text_sm]}>
            {list.name}
          </InlineLinkText>{' '}
          list which you have blocked.
        </Trans>
      )
    } else {
      name = l`User Blocked`
      description = l`You have blocked this user. You cannot view their content.`
    }
  } else if (modcause.type === 'blocked-by') {
    name = l`User Blocks You`
    description = l`This user has blocked you. You cannot view their content.`
  } else if (modcause.type === 'block-other') {
    name = l`Content Not Available`
    description = l`This content is not available because one of the users involved has blocked the other.`
  } else if (modcause.type === 'muted') {
    if (modcause.source.type === 'list') {
      const list = modcause.source.list
      name = l`Account Muted by List`
      description = (
        <Trans>
          This user is included in the{' '}
          <InlineLinkText
            label={list.name}
            to={listUriToHref(list.uri)}
            style={[a.text_sm]}>
            {list.name}
          </InlineLinkText>{' '}
          list which you have muted.
        </Trans>
      )
    } else {
      name = l`Account Muted`
      description = l`You have muted this account.`
    }
  } else if (modcause.type === 'mute-word') {
    name = l`Post Hidden by Muted Word`
    description = l`You've chosen to hide a word or tag within this post.`
  } else if (modcause.type === 'hidden') {
    name = l`Post Hidden by You`
    description = l`You have hidden this post.`
  } else if (modcause.type === 'reply-hidden') {
    const isYou = currentAccount?.did === modcause.source.did
    name = isYou ? l`Reply Hidden by You` : l`Reply Hidden by Thread Author`
    description = isYou
      ? l`You hid this reply.`
      : l`The author of this thread has hidden this reply.`
  } else if (modcause.type === 'label') {
    name = desc.name
    description = (
      <Text emoji style={[t.atoms.text, a.text_md, a.leading_snug]}>
        {desc.description}
      </Text>
    )
  } else {
    // should never happen
    name = ''
    description = ''
  }

  const sourceName =
    desc.source || desc.sourceDisplayName || l`an unknown labeler`

  if (isAppealing && modcause?.type === 'label') {
    return (
      <Dialog.ScrollableInner
        label={l`Appeal label`}
        style={web({
          maxWidth: 460,
        })}>
        <AppealForm
          label={modcause.label}
          control={control}
          onPressBack={() => setIsAppealing(false)}
        />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    )
  }

  return (
    <Dialog.ScrollableInner
      label={l`Moderation details`}
      contentContainerStyle={{
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
      }}
      style={web({
        maxWidth: 460,
      })}>
      <View style={[xGutters, a.pb_lg]}>
        <Text emoji style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm]}>
          {name}
        </Text>
        <Text style={[t.atoms.text, a.text_sm, a.leading_snug]}>
          {description}
        </Text>

        {canAppeal && (
          <View
            style={[
              a.flex_row,
              a.flex_wrap,
              a.gap_sm,
              a.pt_md,
              a.pb_xs,
              a.mt_md,
              a.border_t,
              t.atoms.border_contrast_low,
            ]}>
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_medium,
                gtPhone ? a.flex_1 : a.w_full,
              ]}>
              <Trans>
                You may appeal these labels if you feel they were placed in
                error.
              </Trans>
            </Text>
            <Button
              variant="solid"
              color="primary_subtle"
              size="small"
              label={l`Appeal this label`}
              style={[gtPhone ? undefined : a.w_full]}
              onPress={() => setIsAppealing(true)}>
              <ButtonText>
                <Trans>Appeal</Trans>
              </ButtonText>
            </Button>
          </View>
        )}

        {desc.isSubjectAccount && (
          <Admonition type="info" style={[a.mt_md]}>
            <Trans>
              This label was applied to the entire user account and will appear
              on all posts.
            </Trans>
          </Admonition>
        )}
      </View>
      {modcause?.type === 'label' && (
        <View
          style={[
            xGutters,
            a.py_md,
            a.border_t,
            !IS_NATIVE && t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            {
              borderBottomLeftRadius: a.rounded_md.borderRadius,
              borderBottomRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          {modcause.source.type === 'user' ? (
            <Text style={[t.atoms.text, a.text_md, a.leading_snug]}>
              <Trans>This label was applied by the author.</Trans>
            </Text>
          ) : (
            <>
              <View
                style={[
                  a.flex_row,
                  a.justify_between,
                  a.gap_xl,
                  {paddingBottom: 1},
                ]}>
                <Text
                  style={[
                    a.flex_1,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={1}>
                  <Trans>
                    Source:{' '}
                    <InlineLinkText
                      label={sourceName}
                      to={makeProfileLink({
                        did: modcause.label.src,
                        handle: '',
                      })}
                      onPress={() => control.close()}>
                      {sourceName}
                    </InlineLinkText>
                  </Trans>
                </Text>
                {modcause.label.exp && (
                  <View>
                    <Text
                      style={[
                        a.leading_snug,
                        a.text_sm,
                        a.italic,
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        Expires in {timeDiff(Date.now(), modcause.label.exp)}
                      </Trans>
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}
      {IS_NATIVE && <View style={{height: 40}} />}
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
