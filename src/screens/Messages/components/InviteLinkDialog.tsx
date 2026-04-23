import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {shareUrl} from '#/lib/sharing'
import {useCreateJoinLink} from '#/state/queries/messages/create-join-link'
import {useDisableJoinLink} from '#/state/queries/messages/disable-join-link'
import {useEditJoinLink} from '#/state/queries/messages/edit-join-link'
import {useEnableJoinLink} from '#/state/queries/messages/enable-join-link'
import {atoms as a, useTheme, web} from '#/alf'
import {
  Button,
  ButtonIcon,
  ButtonText,
  StackedButton,
} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type ConvoWithDetails} from '#/components/dms/util'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon} from '#/components/icons/ChainLink'
import {EditBig_Stroke2_Corner2_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {CopyTextButton} from './CopyTextButton'
import {EditTextButton} from './EditTextButton'

enum Step {
  INFO,
  GENERATE,
  MANAGE,
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
})
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function InviteLinkDialog({
  convo,
  control,
  isOwner,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  control: Dialog.DialogOuterProps['control']
  isOwner: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const ownerName = createSanitizedDisplayName(convo.primaryMember)

  const {joinLink} = convo.details
  const enabledStatus = joinLink?.enabledStatus

  const defaultStep = joinLink ? Step.MANAGE : Step.INFO
  const defaultWhoCanJoin = joinLink
    ? [
        `${joinLink.joinRule}${joinLink.requireApproval ? ':requireApproval' : ''}`,
      ]
    : ['anyone']

  const [step, setStep] = useState<Step>(defaultStep)
  const [whoCanJoin, setWhoCanJoin] = useState(defaultWhoCanJoin)

  const {openComposer} = useOpenComposer()

  const {mutate: createJoinLink, isPending: isCreating} = useCreateJoinLink(
    convo.view.id,
    {
      onSuccess: () => {
        setStep(Step.MANAGE)
      },
      onError: () => {
        Toast.show(l`Failed to create invite link`, {
          type: 'error',
        })
      },
    },
  )
  const {mutate: editJoinLink, isPending: isEditing} = useEditJoinLink(
    convo.view.id,
    {
      onSuccess: () => {
        setStep(Step.MANAGE)
      },
      onError: () => {
        Toast.show(l`Failed to edit invite link`, {
          type: 'error',
        })
      },
    },
  )
  const {mutate: disableJoinLink, isPending: isDisabling} = useDisableJoinLink(
    convo.view.id,
    {
      onError: () => {
        Toast.show(l`Failed to disable invite link`, {
          type: 'error',
        })
      },
    },
  )
  const {mutate: enableJoinLink, isPending: isEnabling} = useEnableJoinLink(
    convo.view.id,
    {
      onError: () => {
        Toast.show(l`Failed to enable invite link`, {
          type: 'error',
        })
      },
    },
  )
  const isSaving = isCreating || isEditing

  const whoCanJoinOptions = [
    {
      name: 'anyone',
      owner: l`Anyone can join instantly`,
      member: l`Anyone can join instantly`,
    },
    {
      name: 'anyone:requireApproval',
      owner: l`Anyone can request to join`,
      member: l`Anyone can request to join`,
    },
    {
      name: 'followedByOwner',
      owner: l`People I follow can join instantly`,
      member: l`People ${ownerName} follows can join instantly`,
    },
    {
      name: 'followedByOwner:requireApproval',
      owner: l`People I follow can request to join`,
      member: l`People ${ownerName} follows can request to join`,
    },
  ]

  let content: React.ReactNode = null
  let header: string | null = null
  switch (step) {
    case Step.INFO:
      header = l`Invite link`
      content = (
        <>
          <View>
            <Text style={[a.text_md, t.atoms.text]}>
              <Trans>
                An invite link lets people join this group chat without being
                added directly. You control who can use the link and whether
                they need your approval. You can disable the link at any time.
              </Trans>
            </Text>
            <Text style={[a.mt_lg, a.text_md, t.atoms.text]}>
              <Trans>
                Your name, avatar, and the name of the group chat will be
                visible to everyone.
              </Trans>
            </Text>
          </View>
          <View style={[a.mt_4xl]}>
            <Button
              label={l`Get started`}
              color="primary"
              size="large"
              onPress={() => {
                setStep(Step.GENERATE)
              }}>
              <ButtonText>
                <Trans>Get started</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRightIcon} />
            </Button>
          </View>
        </>
      )
      break
    case Step.GENERATE:
      header = l`Generate invite link`
      content = (
        <>
          <View>
            <Text style={[a.text_md, t.atoms.text]}>
              <Trans>Choose who can join this group chat and how.</Trans>
            </Text>
          </View>
          <View style={[a.mt_lg]}>
            <Toggle.Group
              label={l`Who can join this group chat and how`}
              type="radio"
              values={whoCanJoin}
              onChange={setWhoCanJoin}>
              <View style={[a.gap_sm]}>
                {whoCanJoinOptions.map(option => (
                  <Toggle.Item
                    key={option.name}
                    highlightRow={true}
                    label={isOwner ? option.owner : option.member}
                    name={option.name}
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <TargetOption
                        label={isOwner ? option.owner : option.member}
                        selected={selected}
                      />
                    )}
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
          </View>
          <View style={[a.mt_4xl]}>
            <Button
              label={l`Generate invite link`}
              color="primary"
              size="large"
              disabled={isSaving}
              onPress={() => {
                const parts = whoCanJoin[0].split(':')
                const joinRule = parts[0]
                const requireApproval = parts[1] === 'requireApproval'
                if (joinLink && enabledStatus === 'enabled') {
                  editJoinLink({
                    joinRule,
                    requireApproval,
                  })
                } else {
                  createJoinLink({
                    joinRule,
                    requireApproval,
                  })
                }
              }}>
              <ButtonText>
                {joinLink && enabledStatus === 'enabled'
                  ? l`Update invite link`
                  : l`Generate invite link`}
              </ButtonText>
              <ButtonIcon icon={isSaving ? Loader : ArrowRightIcon} />
            </Button>
          </View>
        </>
      )
      break
    case Step.MANAGE: {
      const hasJoinLinkCode = joinLink && joinLink.code !== ''
      const joinLinkURI = hasJoinLinkCode
        ? `https://bsky.app/chat/${joinLink.code}`
        : 'https://bsky.app/chat'
      const createdAt = joinLink ? new Date(joinLink.createdAt) : null
      const currentOption = whoCanJoinOptions.find(
        o => o.name === whoCanJoin[0],
      )
      const ownerValue = currentOption?.owner ?? whoCanJoinOptions[0].owner
      const memberValue = currentOption?.member ?? whoCanJoinOptions[0].member
      header =
        enabledStatus === 'enabled' ? l`Invite link` : l`Invite link disabled`
      content = (
        <>
          <View style={[a.mt_lg]}>
            <CopyTextButton
              disabled={enabledStatus === 'disabled' || !hasJoinLinkCode}
              label={l`Invite link`}
              value={joinLinkURI}>
              <Text
                numberOfLines={1}
                style={[
                  a.mr_xs,
                  a.text_md,
                  enabledStatus === 'disabled'
                    ? t.atoms.text_contrast_low
                    : t.atoms.text,
                ]}>
                {joinLinkURI}
              </Text>
            </CopyTextButton>
            {createdAt ? (
              <Text style={[a.mt_xs, a.text_xs, t.atoms.text_contrast_medium]}>
                <Trans>
                  Created {timeFormatter.format(createdAt)}{' '}
                  {dateFormatter.format(createdAt)}
                </Trans>
              </Text>
            ) : null}
          </View>
          {enabledStatus === 'enabled' ? (
            <View style={[a.mt_lg]}>
              {isOwner ? (
                <EditTextButton
                  label={l`Edit link settings`}
                  value={ownerValue}
                  onPress={() => setStep(Step.GENERATE)}>
                  <Text
                    numberOfLines={1}
                    style={[
                      a.mr_xs,
                      a.text_md,
                      t.atoms.text,
                      {maxWidth: '80%'},
                    ]}>
                    {ownerValue}
                  </Text>
                </EditTextButton>
              ) : (
                <Text style={[a.text_sm, t.atoms.text]}>{memberValue}</Text>
              )}
            </View>
          ) : null}
          {enabledStatus === 'enabled' ? (
            <View style={[a.flex_row, a.justify_between, a.gap_sm, a.mt_lg]}>
              {isOwner ? (
                <StackedButton
                  label={l`Disable`}
                  icon={isDisabling ? Loader : ChainLinkBrokenIcon}
                  color="negative_subtle"
                  style={[a.flex_1, a.rounded_full]}
                  disabled={isDisabling}
                  onPress={() => {
                    disableJoinLink()
                  }}>
                  <Trans>Disable</Trans>
                </StackedButton>
              ) : null}
              <StackedButton
                disabled={enabledStatus === 'disabled'}
                label={l`Post link`}
                icon={EditIcon}
                color="primary_subtle"
                style={[a.flex_1, a.rounded_full]}
                onPress={() => {
                  control.close(() => {
                    openComposer({
                      text: joinLinkURI,
                      logContext: 'Other',
                    })
                  })
                }}>
                <Trans>Post link</Trans>
              </StackedButton>
              <StackedButton
                disabled={enabledStatus === 'disabled'}
                label={l`Share`}
                icon={ArrowShareRightIcon}
                color="primary_subtle"
                style={[a.flex_1, a.rounded_full]}
                onPress={() => {
                  void shareUrl(joinLinkURI)
                }}>
                <Trans>Share</Trans>
              </StackedButton>
            </View>
          ) : (
            <View style={[a.gap_md, a.mt_lg]}>
              <Button
                label={l`Re-enable invite link`}
                color="primary"
                size="large"
                disabled={isEnabling}
                onPress={() => {
                  enableJoinLink()
                }}>
                <ButtonText>
                  <Trans>Re-enable link</Trans>
                </ButtonText>
                {isEnabling && <ButtonIcon icon={Loader} />}
              </Button>
              <Button
                label={l`Generate new invite link`}
                color="secondary"
                size="large"
                onPress={() => setStep(Step.GENERATE)}>
                <ButtonText>
                  <Trans>Generate new link</Trans>
                </ButtonText>
              </Button>
            </View>
          )}
        </>
      )
      break
    }
  }

  if (!isOwner && (!joinLink || joinLink?.enabledStatus === 'disabled')) {
    header = l`Invite link`
    content = (
      <>
        <View style={[a.mt_lg]}>
          <Text style={[a.text_sm, t.atoms.text]}>
            <Trans>There is no invite link for this group chat.</Trans>
          </Text>
        </View>
        <View style={[a.gap_md, a.mt_lg]}>
          <Button
            label={l`Close`}
            color="primary"
            size="large"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        </View>
      </>
    )
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        setStep(defaultStep)
        setWhoCanJoin(defaultWhoCanJoin)
      }}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        header={
          <View>
            <View style={[IS_WEB ? [a.px_2xl, a.pt_xl] : {paddingTop: 10}]}>
              <Text style={[a.font_bold, a.text_2xl, a.mb_sm, t.atoms.text]}>
                {header}
              </Text>
            </View>
            <Dialog.Close />
          </View>
        }
        label={l`Group chat invite link dialog`}
        style={web({maxWidth: 400})}>
        {content}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function TargetOption({label, selected}: {label: string; selected: boolean}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <Toggle.Radio />
      <Toggle.LabelText
        style={[
          a.font_normal,
          a.flex_1,
          a.leading_tight,
          selected ? t.atoms.text : t.atoms.text_contrast_high,
        ]}>
        {label}
      </Toggle.LabelText>
    </View>
  )
}
